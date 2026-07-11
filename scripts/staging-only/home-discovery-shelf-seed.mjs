/**
 * STAGING ONLY — home discovery shelf verification seed (projects C–F).
 *
 * Does NOT mutate Smoke A / Smoke B fields.
 * Guard: vuqpwvjvgyxffmvpfrxo only.
 *
 * Usage:
 *   node scripts/staging-only/home-discovery-shelf-seed.mjs
 *   node scripts/staging-only/home-discovery-shelf-seed.mjs --execute
 *   node scripts/staging-only/home-discovery-shelf-seed.mjs --rollback
 *   node scripts/staging-only/home-discovery-shelf-seed.mjs --rollback --execute
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";
const PROD_REF = "bpnisgzxuwdxelhnduuf";
const OWNER_ID = "4bdc4a2f-2a39-4599-a14c-91303310ef56";
const SMOKE_A = "41ff5a96-105c-42a2-87b4-787bcfeacb45";
const SMOKE_B = "aa910df8-afdf-4cbb-a00e-42a9518afc52";
const MARKER = "[home-discovery-shelf-seed]";
const TITLE_PREFIX = "Home Seed";

/** Fixed IDs — rollback deletes by these. */
const SEED = {
  C: {
    id: "cccccccc-cccc-4ccc-8ddd-000000000001",
    title: "Home Seed C (newest-only)",
    genre: "アドベンチャー",
    role: "newest_head",
  },
  D: {
    id: "cccccccc-cccc-4ccc-8ddd-000000000002",
    title: "Home Seed D (updated)",
    genre: "シミュレーション",
    role: "updated_head",
    devlogId: "cccccccc-cccc-4ccc-8ddd-100000000002",
  },
  E: {
    id: "cccccccc-cccc-4ccc-8ddd-000000000003",
    title: "Home Seed E (trending)",
    genre: "RPG",
    role: "trending_head",
    feedbackId: "cccccccc-cccc-4ccc-8ddd-200000000003",
  },
  F: {
    id: "cccccccc-cccc-4ccc-8ddd-000000000004",
    title: "Home Seed F (shelf filler)",
    genre: "パズル",
    role: "shelf_filler",
    devlogId: "cccccccc-cccc-4ccc-8ddd-100000000004",
    feedbackId: "cccccccc-cccc-4ccc-8ddd-200000000004",
  },
};

const ENGAGER_EMAIL = "home-discovery-engager@forge-st-home-discovery.local";
const ENGAGER_PASSWORD = `hd-seed-${randomUUID().slice(0, 8)}`;

function loadEnv(path = ".env.local") {
  const env = { ...process.env };
  if (!existsSync(path)) return env;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[trimmed.slice(0, eq).trim()] = value;
  }
  return env;
}

function extractRef(url) {
  try {
    const m = new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function hoursAgoIso(hours) {
  return new Date(Date.now() - hours * 3600_000).toISOString();
}

function assertStaging(env) {
  const ref = extractRef(env.NEXT_PUBLIC_SUPABASE_URL || "");
  if (ref !== STAGING_REF || ref === PROD_REF) {
    throw new Error(`Abort: not staging (ref=${ref})`);
  }
  return ref;
}

function client(env) {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function resolveOwnerName(sb) {
  const { data, error } = await sb
    .from("projects")
    .select("owner_id, owner_name, creator")
    .eq("id", SMOKE_A)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.owner_id !== OWNER_ID) {
    throw new Error("Abort: Smoke A missing or unexpected owner");
  }
  return data.owner_name || data.creator || "Staging Owner";
}

async function ensureEngager(sb) {
  const listed = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listed.error) throw listed.error;
  const existing = (listed.data?.users ?? []).find((u) => u.email === ENGAGER_EMAIL);
  if (existing) return existing.id;

  const created = await sb.auth.admin.createUser({
    email: ENGAGER_EMAIL,
    password: ENGAGER_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: "Home Discovery Engager", seed: MARKER },
  });
  if (created.error) throw created.error;
  return created.data.user.id;
}

function projectPayload(spec, ownerName) {
  return {
    id: spec.id,
    owner_id: OWNER_ID,
    owner_name: ownerName,
    title: spec.title,
    creator: ownerName,
    genre: spec.genre,
    genres: [spec.genre],
    description: `${MARKER} Staging-only shelf verification. Do not promote to production.`,
    overview_introduction: `${MARKER} ${spec.role}`,
    phase: "アルファ",
    status: "アルファ",
    looking_for_testers: false,
    tester_slots: null,
    section: "new",
    thumbnail_url: "/images/landing/game-2.png",
    thumbnail_urls: ["/images/landing/game-2.png"],
    tags: ["staging", "home-discovery-seed"],
    play_url: "https://example.com/forge-home-seed",
    visibility: "public",
    playable_version: "0.1",
    release_status: "in_development",
  };
}

async function upsertProjects(sb, ownerName) {
  const rows = Object.values(SEED).map((spec) => projectPayload(spec, ownerName));
  const { error } = await sb.from("projects").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

async function upsertDevlogs(sb) {
  // Must be AFTER first_published_at (public insert trigger sets now()).
  const tF = new Date(Date.now() + 2_000).toISOString();
  const tD = new Date(Date.now() + 3_000).toISOString();
  const rows = [
    {
      id: SEED.D.devlogId,
      project_id: SEED.D.id,
      author_id: OWNER_ID,
      title: `${MARKER} meaningful update D`,
      content: "Non-initial update for updated shelf.",
      published_version: "0.1.1",
      is_initial_publish: false,
      created_at: tD,
      published_at: tD,
    },
    {
      id: SEED.F.devlogId,
      project_id: SEED.F.id,
      author_id: OWNER_ID,
      title: `${MARKER} meaningful update F`,
      content: "Secondary update so updated shelf has non-hero cards.",
      published_version: "0.1.1",
      is_initial_publish: false,
      created_at: tF,
      published_at: tF,
    },
  ];
  const { error } = await sb.from("project_devlogs").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

async function upsertEngagement(sb, engagerId) {
  // Prefer project_feedback (no prompt_id required) + watches.
  // E should outrank Smoke A on trending via equal-or-higher FB UU and newer engagement.
  const feedbackRows = [
    {
      id: SEED.E.feedbackId,
      project_id: SEED.E.id,
      user_id: engagerId,
      version_key: "0.1",
      good_points: `${MARKER} trending feedback`,
      moderation_status: "visible",
      created_at: hoursAgoIso(30),
      updated_at: hoursAgoIso(30),
    },
    {
      id: SEED.F.feedbackId,
      project_id: SEED.F.id,
      user_id: engagerId,
      version_key: "0.1",
      good_points: `${MARKER} filler feedback`,
      moderation_status: "visible",
      created_at: hoursAgoIso(40),
      updated_at: hoursAgoIso(40),
    },
  ];
  const { error: feedbackError } = await sb
    .from("project_feedback")
    .upsert(feedbackRows, { onConflict: "id" });
  if (feedbackError) throw feedbackError;

  for (const row of [
    { project_id: SEED.E.id, user_id: engagerId, created_at: hoursAgoIso(28) },
    { project_id: SEED.F.id, user_id: engagerId, created_at: hoursAgoIso(36) },
  ]) {
    await sb
      .from("project_watches")
      .delete()
      .eq("project_id", row.project_id)
      .eq("user_id", row.user_id);
    const { error } = await sb.from("project_watches").insert(row);
    if (error) throw error;
  }
}

async function rollback(sb) {
  const projectIds = Object.values(SEED).map((s) => s.id);
  const devlogIds = [SEED.D.devlogId, SEED.F.devlogId];
  const feedbackIds = [SEED.E.feedbackId, SEED.F.feedbackId];

  await sb.from("project_feedback").delete().in("id", feedbackIds);
  await sb.from("project_feedback").delete().in("project_id", projectIds);
  await sb.from("project_voice_responses").delete().in("project_id", projectIds);
  await sb.from("project_watches").delete().in("project_id", projectIds);
  await sb.from("project_devlogs").delete().in("id", devlogIds);
  await sb.from("project_devlogs").delete().in("project_id", projectIds);
  await sb.from("project_play_sessions").delete().in("project_id", projectIds);
  const { error } = await sb.from("projects").delete().in("id", projectIds);
  if (error) throw error;

  return { deletedProjects: projectIds };
}

async function main() {
  const execute = process.argv.includes("--execute");
  const doRollback = process.argv.includes("--rollback");
  const env = loadEnv();
  const ref = assertStaging(env);
  const sb = client(env);

  const plan = {
    ref,
    execute,
    rollback: doRollback,
    keepSmokeA: SMOKE_A,
    keepSmokeB: SMOKE_B,
    projects: Object.values(SEED).map((s) => ({ id: s.id, title: s.title, role: s.role })),
    marker: MARKER,
    titlePrefix: TITLE_PREFIX,
    note: "first_published_at is trigger-forced to now() on insert; 公開 labels for C–F are 今日公開. A/B keep older 公開 labels.",
  };
  console.log(JSON.stringify(plan, null, 2));

  if (!execute) {
    console.log("Dry-run only. Re-run with --execute to write Staging.");
    return;
  }

  if (doRollback) {
    const result = await rollback(sb);
    console.log(JSON.stringify({ ok: true, ...result }, null, 2));
    return;
  }

  const ownerName = await resolveOwnerName(sb);
  const engagerId = await ensureEngager(sb);
  await upsertProjects(sb, ownerName);
  // Brief delay so first_published_at (now) < later backdated? Devlogs use hoursAgo but
  // must be AFTER first_published_at. Insert projects first, then write "future-relative"
  // updates with created_at = now()+small is wrong; use now()-small AFTER insert completes.
  await new Promise((r) => setTimeout(r, 500));
  await upsertDevlogs(sb);
  await upsertEngagement(sb, engagerId);

  const { data: feed, error: feedError } = await sb.rpc("get_home_discovery_feed");
  if (feedError) throw feedError;

  const bySection = (feed ?? []).reduce((acc, row) => {
    acc[row.section] = acc[row.section] || [];
    acc[row.section].push({ rank: row.rank, id: row.project_id, title: row.title });
    return acc;
  }, {});

  console.log(
    JSON.stringify(
      {
        ok: true,
        engagerId,
        publicSeedIds: Object.values(SEED).map((s) => s.id),
        feedBySection: bySection,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
