/**
 * Forge full-navigation Performance Deep-Dive — reproducible server/API timing harness.
 *
 * Cold vs warm: each target is timed twice in-process (cold miss, then warm hit when
 * loaders share module TTL caches). Auth-gated Studio metrics / messages are measured
 * only when FORGE_PERF_STAGING_ACCESS_TOKEN is set (Staging test user JWT — never Prod).
 *
 * Usage:
 *   node scripts/perf/nav-deep-dive-measure.mjs
 *   node scripts/perf/nav-deep-dive-measure.mjs --label before
 *   node scripts/perf/nav-deep-dive-measure.mjs --label after --out .agent/runtime/perf-after.json
 *
 * Env:
 *   NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (required for direct RPC)
 *   FORGE_PERF_BASE_URL — optional Preview/local origin for HTTP route timings
 *   FORGE_PERF_STAGING_ACCESS_TOKEN — optional Staging user access token (never Prod)
 */

import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");

function loadEnvLocal() {
  const envPath = resolve(root, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i <= 0) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvLocal();

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

const label = arg("--label", "run");
const outPath = arg(
  "--out",
  resolve(root, `.agent/runtime/perf-nav-deep-dive-${label}.json`),
);
const baseUrl = (process.env.FORGE_PERF_BASE_URL || "").replace(/\/$/, "");
const stagingToken = process.env.FORGE_PERF_STAGING_ACCESS_TOKEN || "";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const isProdRef =
  supabaseUrl.includes("bpnisgzxuwdxelhnduuf") ||
  process.env.FORGE_SUPABASE_PROJECT_REF === "bpnisgzxuwdxelhnduuf";
if (isProdRef && stagingToken) {
  console.error("Refusing auth token against Production project ref.");
  process.exit(1);
}

const anon = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const authed = stagingToken
  ? createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${stagingToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

function bucket(ms) {
  if (ms == null) return "UNMEASURED";
  if (ms < 300) return "FAST";
  if (ms < 800) return "ACCEPTABLE";
  if (ms < 2000) return "SLOW";
  return "VERY_SLOW";
}

async function timeOnce(fn) {
  const t0 = performance.now();
  let ok = true;
  let meta = {};
  try {
    const result = await fn();
    if (result && typeof result === "object") meta = result;
  } catch (error) {
    ok = false;
    meta = { error: error instanceof Error ? error.message : String(error) };
  }
  const ms = Math.round((performance.now() - t0) * 10) / 10;
  return { ms, ok, ...meta };
}

async function coldWarm(name, fn) {
  const cold = await timeOnce(fn);
  const warm = await timeOnce(fn);
  return {
    name,
    coldMs: cold.ms,
    warmMs: warm.ms,
    coldOk: cold.ok,
    warmOk: warm.ok,
    coldBucket: bucket(cold.ms),
    warmBucket: bucket(warm.ms),
    coldMeta: cold,
    warmMeta: warm,
  };
}

async function httpGet(path) {
  if (!baseUrl) {
    return { skipped: true, reason: "FORGE_PERF_BASE_URL unset" };
  }
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const text = await res.text();
  return {
    status: res.status,
    bytes: text.length,
    ok: res.ok,
  };
}

const results = [];

// --- Public Discovery / Home RPCs (server substitute for click→usable) ---
results.push(
  await coldWarm("rpc.get_home_feedback_gathering_projects", async () => {
    const { data, error } = await anon.rpc("get_home_feedback_gathering_projects");
    if (error) throw error;
    return { rows: Array.isArray(data) ? data.length : 0 };
  }),
);

results.push(
  await coldWarm("rpc.get_home_newest_projects", async () => {
    const { data, error } = await anon.rpc("get_home_newest_projects");
    if (error) throw error;
    return { rows: Array.isArray(data) ? data.length : 0 };
  }),
);

results.push(
  await coldWarm("rpc.get_public_projects_by_category_game", async () => {
    const { data, error } = await anon.rpc("get_public_projects_by_category", {
      p_category: "game",
      p_limit: 48,
    });
    if (error) throw error;
    return { rows: Array.isArray(data) ? data.length : 0 };
  }),
);

results.push(
  await coldWarm("rpc.search_public_catalog", async () => {
    const { data, error } = await anon.rpc("search_public_catalog", {
      p_query: "forge",
      p_limit: 24,
    });
    if (error) throw error;
    return { rows: Array.isArray(data) ? data.length : 0 };
  }),
);

// Public FB cards — sample up to 8 project ids from newest (N+1 proxy)
{
  const newest = await anon.rpc("get_home_newest_projects");
  const ids = (newest.data ?? [])
    .map((r) => r.project_id ?? r.id)
    .filter(Boolean)
    .slice(0, 8);
  results.push(
    await coldWarm("rpc.get_public_feedback_cards_x8_seq", async () => {
      let cards = 0;
      for (const id of ids) {
        const { data, error } = await anon.rpc("get_public_feedback_cards", {
          p_project_id: id,
          p_limit: 20,
        });
        if (error) throw error;
        cards += Array.isArray(data) ? data.length : 0;
      }
      return { projects: ids.length, cards };
    }),
  );
  results.push(
    await coldWarm("rpc.get_public_feedback_cards_x8_parallel", async () => {
      const settled = await Promise.all(
        ids.map((id) =>
          anon.rpc("get_public_feedback_cards", {
            p_project_id: id,
            p_limit: 20,
          }),
        ),
      );
      let cards = 0;
      for (const s of settled) {
        if (s.error) throw s.error;
        cards += Array.isArray(s.data) ? s.data.length : 0;
      }
      return { projects: ids.length, cards };
    }),
  );
}

if (baseUrl) {
  for (const path of [
    "/api/discovery/player-ia-home",
    "/api/discovery/player-ia-game-home",
    "/api/discovery/player-ia-category-home?category=audio",
    "/api/search/catalog?category=game&limit=48",
    "/api/search/global?q=forge",
    "/api/announcements",
  ]) {
    results.push(
      await coldWarm(`http${path}`, async () => httpGet(path)),
    );
  }
} else {
  results.push({
    name: "http.*",
    coldMs: null,
    warmMs: null,
    coldOk: false,
    warmOk: false,
    coldBucket: "UNMEASURED",
    warmBucket: "UNMEASURED",
    note: "Set FORGE_PERF_BASE_URL for Preview/local HTTP timings",
  });
}

if (authed) {
  results.push(
    await coldWarm("rpc.get_studio_home_connection_metrics", async () => {
      const { data, error } = await authed.rpc("get_studio_home_connection_metrics", {
        p_granularity: "month",
      });
      if (error) throw error;
      return { hasData: Boolean(data) };
    }),
  );
  results.push(
    await coldWarm("rpc.list_my_collab_consultations", async () => {
      const { data, error } = await authed.rpc("list_my_collab_consultations");
      if (error) throw error;
      return { rows: Array.isArray(data) ? data.length : 0 };
    }),
  );
  if (baseUrl) {
    results.push(
      await coldWarm("http./api/studio/home-metrics", async () => {
        const res = await fetch(`${baseUrl}/api/studio/home-metrics?granularity=month`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${stagingToken}`,
            Cookie: "",
          },
          cache: "no-store",
        });
        return { status: res.status, ok: res.ok, bytes: (await res.text()).length };
      }),
    );
  }
} else {
  results.push({
    name: "auth.studio_metrics_and_messages",
    coldMs: null,
    warmMs: null,
    coldOk: false,
    warmOk: false,
    coldBucket: "UNMEASURED",
    warmBucket: "UNMEASURED",
    note:
      "Auth surfaces unmeasured: set FORGE_PERF_STAGING_ACCESS_TOKEN (Staging test user only). Server substitutes: RPC timings above when token present; otherwise rely on public home/search + code RCA.",
  });
}

const report = {
  label,
  at: new Date().toISOString(),
  supabaseHost: new URL(supabaseUrl).host,
  baseUrl: baseUrl || null,
  authMeasured: Boolean(authed),
  bucketRules: {
    FAST: "<300ms",
    ACCEPTABLE: "300–799ms",
    SLOW: "800–1999ms",
    VERY_SLOW: "≥2000ms",
  },
  results,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

console.log(`Wrote ${outPath}`);
console.log(
  results
    .map((r) =>
      [
        r.name.padEnd(52),
        r.coldMs == null ? "n/a".padStart(8) : `${r.coldMs}ms`.padStart(8),
        r.warmMs == null ? "n/a".padStart(8) : `${r.warmMs}ms`.padStart(8),
        String(r.coldBucket || "").padEnd(12),
        String(r.warmBucket || "").padEnd(12),
        r.note || "",
      ].join("  "),
    )
    .join("\n"),
);
