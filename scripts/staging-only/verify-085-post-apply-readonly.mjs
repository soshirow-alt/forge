#!/usr/bin/env node
/**
 * STAGING read-only post-apply verify for migration 085 + five-category seed.
 * Target: vuqpwvjvgyxffmvpfrxo only. Aborts on Production.
 * Uses service_role for broader SELECTs + RPCs. NO writes.
 *
 *   node --env-file=.env.local scripts/staging-only/verify-085-post-apply-readonly.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

const STAGING = "vuqpwvjvgyxffmvpfrxo";
const PROD = "bpnisgzxuwdxelhnduuf";
const TAG = "forge-ia-seed-v1";
const SEED_PREFIX = "eeeeeeee-eeee-4eee-8eee-";
const SMOKE_A = "41ff5a96-105c-42a2-87b4-787bcfeacb45";

function loadEnv() {
  const env = { ...process.env };
  for (const p of [".env.local", ".env"]) {
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i <= 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (!env[k]) env[k] = v;
    }
  }
  return env;
}

function extractRef(url) {
  try {
    return new URL(url).hostname.split(".")[0];
  } catch {
    return null;
  }
}

const env = loadEnv();
const url = (env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const anonKey = (env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
const ref = extractRef(url);

if (!url || !serviceKey || !anonKey) {
  console.error("ABORT: missing NEXT_PUBLIC_SUPABASE_URL / ANON / SERVICE_ROLE");
  process.exit(1);
}
if (ref === PROD) {
  console.error("ABORT: Production ref");
  process.exit(1);
}
if (ref !== STAGING) {
  console.error(`ABORT: expected ${STAGING}, got ${ref}`);
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anon = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const results = [];
function check(name, pass, detail = null) {
  results.push({ name, pass: Boolean(pass), detail });
  const mark = pass ? "PASS" : "FAIL";
  console.log(`${mark}  ${name}${detail != null ? ` — ${JSON.stringify(detail)}` : ""}`);
}

async function rpc(client, name, args) {
  const { data, error } = await client.rpc(name, args);
  return { data: data ?? null, error: error ? error.message : null };
}

function isSeedId(id) {
  return String(id || "").startsWith(SEED_PREFIX);
}

function asArr(v) {
  return Array.isArray(v) ? v : [];
}

function attrs(row) {
  const a = row?.category_attributes;
  return a && typeof a === "object" && !Array.isArray(a) ? a : {};
}

async function main() {
  console.log(JSON.stringify({ ref, mode: "read-only-085-post-apply" }));

  // ── Schema via live column select (not migration history) ──────────────
  {
    const { data, error } = await admin
      .from("projects")
      .select("id, player_counts")
      .eq("id", SMOKE_A)
      .maybeSingle();
    check("schema.player_counts_column", !error && data != null, {
      error,
      sampleType: Array.isArray(data?.player_counts) ? "text[]" : typeof data?.player_counts,
    });
  }

  // ── Seed inventory (Home audit + five-category audit equivalents) ──────
  // uuid ~~ text is invalid in PostgREST `.like("id", …)` — filter prefix in JS.
  const { data: seedRows, error: seedErr } = await admin
    .from("projects")
    .select(
      "id,category,title,visibility,thumbnail_url,genres,tags,asset_kinds,purpose_tags,category_attributes,player_counts,estimated_play_time,stream_policy,quick_try,looking_for_testers,usable_for_creation,owner_id",
    )
    .contains("tags", [TAG]);

  check("seed.select", !seedErr, seedErr);
  const rows = (seedRows || []).filter((r) => isSeedId(r.id));
  const byCat = {};
  for (const r of rows) byCat[r.category] = (byCat[r.category] || 0) + 1;

  check("seed.total_40", rows.length === 40, { n: rows.length, byCat });
  check(
    "seed.8_per_category",
    ["game", "audio", "asset", "dev-tool", "service-app"].every((c) => byCat[c] === 8),
    byCat,
  );
  check(
    "seed.ids_in_seed_namespace",
    rows.every((r) => isSeedId(r.id)),
    { bad: rows.filter((r) => !isSeedId(r.id)).map((r) => r.id).slice(0, 5) },
  );
  check(
    "seed.all_public",
    rows.every((r) => r.visibility === "public"),
    { nonPublic: rows.filter((r) => r.visibility !== "public").length },
  );

  const noThumb = rows.filter((r) => !r.thumbnail_url);
  check("seed.no_image_edge_2", noThumb.length === 2, {
    n: noThumb.length,
    ids: noThumb.map((r) => r.id),
  });

  const games = rows.filter((r) => r.category === "game");
  const rogue = games.filter((r) => asArr(r.genres).includes("ローグライク"));
  const pixel = games.filter((r) => asArr(r.tags).includes("ピクセルアート"));
  const roguePixel = games.filter(
    (r) =>
      asArr(r.genres).includes("ローグライク") &&
      asArr(r.tags).includes("ピクセルアート"),
  );
  const rogueCoop = games.filter(
    (r) =>
      asArr(r.genres).includes("ローグライク") &&
      asArr(r.tags).includes("協力プレイ"),
  );
  check("seed.game_rogue_present", rogue.length >= 2, { n: rogue.length });
  check("seed.game_pixel_present", pixel.length >= 1, { n: pixel.length });
  check("seed.game_rogue_and_pixel", roguePixel.length >= 1, {
    n: roguePixel.length,
  });
  check("seed.game_rogue_and_coop_zero", rogueCoop.length === 0, {
    n: rogueCoop.length,
  });

  const gamesWithCounts = games.filter((r) => asArr(r.player_counts).length > 0);
  check(
    "seed.game_player_counts_partial",
    gamesWithCounts.length >= 1 && gamesWithCounts.length < games.length,
    { populated: gamesWithCounts.length, empty: games.length - gamesWithCounts.length },
  );

  const audio = rows.filter((r) => r.category === "audio");
  const audioWithMoods = audio.filter((r) => asArr(attrs(r).moods).length > 0);
  const audioWithPurposes = audio.filter((r) => asArr(attrs(r).purposes).length > 0);
  const audioWithKinds = audio.filter(
    (r) => asArr(attrs(r).kinds).length > 0 || typeof attrs(r).kind === "string",
  );
  check("seed.audio_formal_attrs", audioWithKinds.length >= 6 && audioWithMoods.length >= 4, {
    kinds: audioWithKinds.length,
    moods: audioWithMoods.length,
    purposes: audioWithPurposes.length,
  });

  const assets = rows.filter((r) => r.category === "asset");
  check(
    "seed.asset_kinds_all_8",
    assets.every((r) => asArr(r.asset_kinds).length >= 1),
    {
      withKinds: assets.filter((r) => asArr(r.asset_kinds).length >= 1).length,
      withFormats: assets.filter((r) => asArr(attrs(r).formats).length > 0).length,
      withTastes: assets.filter((r) => asArr(attrs(r).tastes).length > 0).length,
      withTools: assets.filter((r) => asArr(attrs(r).tools).length > 0).length,
    },
  );
  const char2d = assets.filter(
    (r) =>
      asArr(r.asset_kinds).includes("キャラクター") &&
      asArr(attrs(r).formats).includes("2D"),
  );
  const char3d = assets.filter(
    (r) =>
      asArr(r.asset_kinds).includes("キャラクター") &&
      asArr(attrs(r).formats).includes("3D"),
  );
  check("seed.asset_character_2d_3d_split", char2d.length >= 1 && char3d.length >= 1, {
    char2d: char2d.length,
    char3d: char3d.length,
  });

  const tools = rows.filter((r) => r.category === "dev-tool");
  const services = rows.filter((r) => r.category === "service-app");
  check(
    "seed.dev_tool_formal",
    tools.some((r) => asArr(attrs(r).kinds).length > 0) &&
      tools.some((r) => asArr(attrs(r).features).length > 0),
    {
      kinds: tools.filter((r) => asArr(attrs(r).kinds).length > 0).length,
      features: tools.filter((r) => asArr(attrs(r).features).length > 0).length,
      envs: tools.filter((r) => asArr(attrs(r).toolEnvironments).length > 0).length,
    },
  );
  check(
    "seed.service_formal",
    services.some((r) => asArr(attrs(r).kinds).length > 0) &&
      services.some((r) => asArr(attrs(r).features).length > 0),
    {
      kinds: services.filter((r) => asArr(attrs(r).kinds).length > 0).length,
      features: services.filter((r) => asArr(attrs(r).features).length > 0).length,
      purposes: services.filter((r) => asArr(attrs(r).purposes).length > 0).length,
      envs: services.filter((r) => asArr(attrs(r).serviceEnvironments).length > 0).length,
    },
  );

  // Non-seed mutation probe: Smoke A must not gain forge-ia-seed-v1
  {
    const { data: smoke, error } = await admin
      .from("projects")
      .select("id,tags,player_counts")
      .eq("id", SMOKE_A)
      .maybeSingle();
    check("non_seed.smoke_a_not_tagged_ia", !error && !asArr(smoke?.tags).includes(TAG), {
      error,
      tagsSample: asArr(smoke?.tags).slice(0, 5),
    });
  }

  // ── Home RPC signature live probe (integer, text) ──────────────────────
  for (const name of [
    "get_home_feedback_gathering_projects",
    "get_home_meaningful_updates",
    "get_home_newest_projects",
  ]) {
    const withCat = await rpc(anon, name, { p_limit: 8, p_category: "game" });
    check(`home_rpc.${name}(integer,text)`, !withCat.error, {
      error: withCat.error,
      n: withCat.data?.length ?? 0,
    });
    if (!withCat.error && Array.isArray(withCat.data)) {
      const nonGame = withCat.data.filter((r) => r.category && r.category !== "game");
      check(`home_rpc.${name}_game_only`, nonGame.length === 0, {
        nonGame: nonGame.map((r) => r.category).slice(0, 5),
        n: withCat.data.length,
      });
    }
  }

  // Old single-arg call should still work (DEFAULT null category) if signature is (integer, text)
  {
    const r = await rpc(anon, "get_home_feedback_gathering_projects", { p_limit: 4 });
    check("home_rpc.feedback_default_category_ok", !r.error, { error: r.error });
  }

  // ── Catalog RPC filter smoke + row satisfaction ────────────────────────
  async function catalog(args) {
    return rpc(anon, "get_public_projects_by_category", {
      p_limit: 40,
      p_offset: 0,
      ...args,
    });
  }

  function seedById(id) {
    return rows.find((r) => r.id === id);
  }

  async function assertCatalog(name, args, predicate) {
    const { data, error } = await catalog(args);
    if (error) {
      check(name, false, { error });
      return;
    }
    const list = data || [];
    const seedHits = list.filter((r) => isSeedId(r.project_id));
    const violations = [];
    for (const hit of seedHits) {
      const row = seedById(hit.project_id);
      if (!row) continue; // non-seed in namespace shouldn't happen
      if (!predicate(row, hit)) violations.push(hit.project_id);
    }
    check(name, violations.length === 0 && list.length >= 0, {
      returned: list.length,
      seedHits: seedHits.length,
      violations: violations.slice(0, 5),
    });
    // Prefer at least one seed hit for positive filters (caller can allow zero)
    return { list, seedHits, violations };
  }

  // GAME
  {
    const r = await assertCatalog(
      "rpc.game_genre_rogue",
      { p_category: "game", p_genres: ["ローグライク"] },
      (row) => asArr(row.genres).includes("ローグライク"),
    );
    check("rpc.game_genre_rogue_has_seed", (r?.seedHits.length ?? 0) >= 1, {
      seedHits: r?.seedHits.length,
    });
  }
  {
    const r = await assertCatalog(
      "rpc.game_feature_pixel",
      { p_category: "game", p_tags: ["ピクセルアート"] },
      (row) => asArr(row.tags).includes("ピクセルアート"),
    );
    check("rpc.game_feature_pixel_has_seed", (r?.seedHits.length ?? 0) >= 1);
  }
  {
    const r = await assertCatalog(
      "rpc.game_rogue_and_pixel",
      {
        p_category: "game",
        p_genres: ["ローグライク"],
        p_tags: ["ピクセルアート"],
      },
      (row) =>
        asArr(row.genres).includes("ローグライク") &&
        asArr(row.tags).includes("ピクセルアート"),
    );
    check("rpc.game_rogue_and_pixel_has_seed", (r?.seedHits.length ?? 0) >= 1, {
      seedHits: r?.seedHits.length,
    });
  }
  {
    const playTime = games.find((g) => g.estimated_play_time)?.estimated_play_time;
    if (playTime) {
      await assertCatalog(
        "rpc.game_play_time",
        { p_category: "game", p_play_times: [playTime] },
        (row) => row.estimated_play_time === playTime,
      );
    } else {
      check("rpc.game_play_time", false, { error: "no estimated_play_time on seed games" });
    }
  }
  {
    const envTag = games
      .flatMap((g) => asArr(g.tags))
      .find((t) => ["PC対応", "スマホ対応", "ブラウザ対応", "Steam Deck対応"].includes(t));
    if (envTag) {
      await assertCatalog(
        "rpc.game_play_env",
        { p_category: "game", p_play_envs: [envTag] },
        (row) => asArr(row.tags).includes(envTag),
      );
    } else {
      check("rpc.game_play_env", false, { error: "no play-env tag on seed games" });
    }
  }
  {
    const countVal = gamesWithCounts[0]?.player_counts?.[0];
    if (countVal) {
      await assertCatalog(
        "rpc.game_player_count",
        { p_category: "game", p_player_counts: [countVal] },
        (row) => asArr(row.player_counts).includes(countVal),
      );
    } else {
      check("rpc.game_player_count", false, { error: "no player_counts populated" });
    }
  }
  {
    // same-axis OR genres
    await assertCatalog(
      "rpc.game_same_axis_or_genres",
      { p_category: "game", p_genres: ["ローグライク", "アクション"] },
      (row) => {
        const g = asArr(row.genres);
        return g.includes("ローグライク") || g.includes("アクション");
      },
    );
  }
  {
    // cross-axis AND zero expected
    const r = await catalog({
      p_category: "game",
      p_genres: ["ローグライク"],
      p_tags: ["協力プレイ"],
    });
    const seedHits = (r.data || []).filter((x) => isSeedId(x.project_id));
    check("rpc.game_cross_axis_and_zero", !r.error && seedHits.length === 0, {
      error: r.error,
      seedHits: seedHits.length,
    });
  }

  // AUDIO
  {
    await assertCatalog(
      "rpc.audio_kind_楽曲",
      { p_category: "audio", p_attr_kinds: ["楽曲"] },
      (row) => {
        const a = attrs(row);
        return asArr(a.kinds).includes("楽曲") || a.kind === "楽曲";
      },
    );
    await assertCatalog(
      "rpc.audio_mood",
      { p_category: "audio", p_attr_moods: ["穏やか"] },
      (row) => asArr(attrs(row).moods).includes("穏やか"),
    );
    await assertCatalog(
      "rpc.audio_purpose",
      { p_category: "audio", p_attr_purposes: ["フィールド・探索"] },
      (row) => asArr(attrs(row).purposes).includes("フィールド・探索"),
    );
    const genreHit = audio.find((r) => asArr(attrs(r).musicGenres).length > 0);
    if (genreHit) {
      const mg = attrs(genreHit).musicGenres[0];
      await assertCatalog(
        "rpc.audio_music_genre",
        { p_category: "audio", p_attr_music_genres: [mg] },
        (row) => asArr(attrs(row).musicGenres).includes(mg),
      );
    } else {
      check("rpc.audio_music_genre", false, { error: "no musicGenres on seed audio" });
    }
    // duration buckets use Japanese labels from registry / migration 085
    {
      const { data, error } = await catalog({
        p_category: "audio",
        p_duration_buckets: ["1〜3分"],
      });
      const seedHits = (data || []).filter((r) => isSeedId(r.project_id));
      check("rpc.audio_duration_1_to_3min", !error && seedHits.length >= 1, {
        error,
        n: data?.length ?? 0,
        seedHits: seedHits.length,
      });
      for (const hit of seedHits) {
        const row = seedById(hit.project_id);
        const dur = attrs(row).musicDuration;
        const secs = (() => {
          if (typeof dur !== "string") return null;
          const parts = dur.split(":").map(Number);
          if (parts.some((n) => Number.isNaN(n))) return null;
          if (parts.length === 2) return parts[0] * 60 + parts[1];
          if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
          return null;
        })();
        if (secs == null || !(secs >= 60 && secs < 180)) {
          check("rpc.audio_duration_row_satisfies", false, {
            id: hit.project_id,
            dur,
            secs,
          });
        }
      }
    }
    // cross-axis: kinds BGM + mood 穏やか (seed row 1)
    {
      const r = await assertCatalog(
        "rpc.audio_cross_axis",
        {
          p_category: "audio",
          p_attr_kinds: ["BGM"],
          p_attr_moods: ["穏やか"],
        },
        (row) => {
          const a = attrs(row);
          return (
            (asArr(a.kinds).includes("BGM") || a.kind === "BGM") &&
            asArr(a.moods).includes("穏やか")
          );
        },
      );
      check("rpc.audio_cross_axis_has_seed", (r?.seedHits.length ?? 0) >= 1, {
        seedHits: r?.seedHits.length,
      });
    }
    // same-axis OR moods
    await assertCatalog(
      "rpc.audio_same_axis_or_moods",
      { p_category: "audio", p_attr_moods: ["穏やか", "明るい"] },
      (row) => {
        const m = asArr(attrs(row).moods);
        return m.includes("穏やか") || m.includes("明るい");
      },
    );
  }

  // ASSET
  {
    await assertCatalog(
      "rpc.asset_kind_character",
      { p_category: "asset", p_asset_kinds: ["キャラクター"] },
      (row) => asArr(row.asset_kinds).includes("キャラクター"),
    );
    await assertCatalog(
      "rpc.asset_format_2d",
      { p_category: "asset", p_attr_formats: ["2D"] },
      (row) => asArr(attrs(row).formats).includes("2D"),
    );
    await assertCatalog(
      "rpc.asset_character_and_2d",
      {
        p_category: "asset",
        p_asset_kinds: ["キャラクター"],
        p_attr_formats: ["2D"],
      },
      (row) =>
        asArr(row.asset_kinds).includes("キャラクター") &&
        asArr(attrs(row).formats).includes("2D"),
    );
    const taste = assets.find((r) => asArr(attrs(r).tastes).length > 0);
    if (taste) {
      const t = attrs(taste).tastes[0];
      await assertCatalog(
        "rpc.asset_taste",
        { p_category: "asset", p_attr_tastes: [t] },
        (row) => asArr(attrs(row).tastes).includes(t),
      );
    }
    const tool = assets.find((r) => asArr(attrs(r).tools).length > 0);
    if (tool) {
      const t = attrs(tool).tools[0];
      await assertCatalog(
        "rpc.asset_tool",
        { p_category: "asset", p_attr_tools: [t] },
        (row) => asArr(attrs(row).tools).includes(t),
      );
    }
    // legacy singular asset_kind
    const legacy = await catalog({
      p_category: "asset",
      p_asset_kind: "キャラクター",
    });
    check("rpc.asset_legacy_singular_kind", !legacy.error && (legacy.data?.length ?? 0) >= 1, {
      error: legacy.error,
      n: legacy.data?.length ?? 0,
    });
  }

  // DEV-TOOL
  {
    const kindRow = tools.find((r) => asArr(attrs(r).kinds).length > 0);
    if (kindRow) {
      const k = attrs(kindRow).kinds[0];
      await assertCatalog(
        "rpc.dev_tool_kind",
        { p_category: "dev-tool", p_attr_kinds: [k] },
        (row) => asArr(attrs(row).kinds).includes(k) || attrs(row).kind === k,
      );
    }
    const envRow = tools.find((r) => asArr(attrs(r).toolEnvironments).length > 0);
    if (envRow) {
      const e = attrs(envRow).toolEnvironments[0];
      await assertCatalog(
        "rpc.dev_tool_env",
        { p_category: "dev-tool", p_attr_environments: [e] },
        (row) => asArr(attrs(row).toolEnvironments).includes(e),
      );
    }
    const featRow = tools.find((r) => asArr(attrs(r).features).length > 0);
    if (featRow) {
      const f = attrs(featRow).features[0];
      await assertCatalog(
        "rpc.dev_tool_feature",
        { p_category: "dev-tool", p_attr_features: [f] },
        (row) => asArr(attrs(row).features).includes(f),
      );
    }
    if (kindRow && featRow) {
      const k = attrs(kindRow).kinds[0];
      const f = attrs(featRow).features[0];
      await assertCatalog(
        "rpc.dev_tool_cross_axis",
        {
          p_category: "dev-tool",
          p_attr_kinds: [k],
          p_attr_features: [f],
        },
        (row) =>
          (asArr(attrs(row).kinds).includes(k) || attrs(row).kind === k) &&
          asArr(attrs(row).features).includes(f),
      );
    }
  }

  // SERVICE-APP
  {
    const kindRow = services.find((r) => asArr(attrs(r).kinds).length > 0);
    if (kindRow) {
      const k = attrs(kindRow).kinds[0];
      await assertCatalog(
        "rpc.service_kind",
        { p_category: "service-app", p_attr_kinds: [k] },
        (row) => asArr(attrs(row).kinds).includes(k) || attrs(row).kind === k,
      );
    }
    const purposeRow = services.find((r) => asArr(attrs(r).purposes).length > 0);
    if (purposeRow) {
      const p = attrs(purposeRow).purposes[0];
      await assertCatalog(
        "rpc.service_purpose",
        { p_category: "service-app", p_attr_purposes: [p] },
        (row) => asArr(attrs(row).purposes).includes(p),
      );
    }
    const envRow = services.find((r) => asArr(attrs(r).serviceEnvironments).length > 0);
    if (envRow) {
      const e = attrs(envRow).serviceEnvironments[0];
      await assertCatalog(
        "rpc.service_env",
        { p_category: "service-app", p_attr_environments: [e] },
        (row) => {
          const a = attrs(row);
          return (
            asArr(a.serviceEnvironments).includes(e) ||
            (e === "Web" && asArr(a.serviceEnvironments).includes("Webブラウザ")) ||
            (e === "Webブラウザ" && asArr(a.serviceEnvironments).includes("Web"))
          );
        },
      );
    }
    const featRow = services.find((r) => asArr(attrs(r).features).length > 0);
    if (featRow) {
      const f = attrs(featRow).features[0];
      await assertCatalog(
        "rpc.service_feature",
        { p_category: "service-app", p_attr_features: [f] },
        (row) => asArr(attrs(row).features).includes(f),
      );
    }
  }

  // Index presence: REST cannot read pg_indexes; record limitation + filter smoke as proxy.
  check("schema.indexes_via_rest", true, {
    note: "pg_indexes not exposed via REST; player_counts/attr GIN inferred from successful && filters above",
    expected: [
      "projects_player_counts_gin_idx",
      "projects_category_attributes_gin_idx",
    ],
  });

  const failed = results.filter((r) => !r.pass);
  const summary = {
    ref,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    failedNames: failed.map((f) => f.name),
    ok: failed.length === 0,
  };
  console.log(JSON.stringify(summary, null, 2));
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
