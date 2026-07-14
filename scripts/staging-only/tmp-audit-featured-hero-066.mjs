/**
 * Staging/Prod read-only audit of featured hero 066 axes + shelf stability.
 *
 * Usage:
 *   node scripts/staging-only/tmp-audit-featured-hero-066.mjs staging
 *   node scripts/staging-only/tmp-audit-featured-hero-066.mjs production
 *
 * HARD GUARD: staging→vuqpwvjvgyxffmvpfrxo, production→bpnisgzxuwdxelhnduuf
 * Production path is read-only RPC/SQL SELECT via anon (no writes).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";
const PROD_REF = "bpnisgzxuwdxelhnduuf";

function loadEnv(paths) {
  const env = { ...process.env };
  for (const path of paths) {
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq <= 0) continue;
      let v = t.slice(eq + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      const k = t.slice(0, eq).trim();
      if (!env[k]) env[k] = v;
    }
  }
  return env;
}

const target = (process.argv[2] || "staging").toLowerCase();
const expectedRef = target === "production" ? PROD_REF : STAGING_REF;
const envFiles =
  target === "production"
    ? [".env.vercel.production", ".env.local"]
    : [".env.local", ".env.vercel.preview"];

const env = loadEnv(envFiles);
const url = (env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const key = (env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
if (!url || !key) {
  console.error(JSON.stringify({ blocked: true, reason: "missing url/key" }));
  process.exit(2);
}
const ref = new URL(url).hostname.split(".")[0];
if (ref !== expectedRef) {
  console.error(JSON.stringify({ blocked: true, ref, expectedRef }));
  process.exit(2);
}

async function rpc(name) {
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  const body = await res.json();
  return { ok: res.ok, status: res.status, body };
}

const feed = await rpc("get_home_discovery_feed");
const hero = await rpc("get_home_featured_hero");

const shelves = {
  newest: (feed.body || [])
    .filter((r) => r.section === "newest")
    .sort((a, b) => a.rank - b.rank)
    .map((r) => ({ id: r.project_id, title: r.title, rank: r.rank })),
  updated: (feed.body || [])
    .filter((r) => r.section === "updated")
    .sort((a, b) => a.rank - b.rank)
    .map((r) => ({ id: r.project_id, title: r.title, rank: r.rank })),
  trending: (feed.body || [])
    .filter((r) => r.section === "trending")
    .sort((a, b) => a.rank - b.rank)
    .map((r) => ({
      id: r.project_id,
      title: r.title,
      rank: r.rank,
      fb7: r.feedback_users_7d,
      watch7: r.watchers_7d,
      play7: r.players_7d,
    })),
};

const heroRows = Array.isArray(hero.body) ? hero.body : [];
const heroIds = heroRows.map((r) => r.project_id);
const dupHero = heroIds.length !== new Set(heroIds).size;

const report = {
  target,
  ref,
  feedOk: feed.ok,
  heroOk: hero.ok,
  heroStatus: hero.status,
  heroError: hero.ok ? null : hero.body,
  shelves: {
    newestCount: shelves.newest.length,
    updatedCount: shelves.updated.length,
    trendingCount: shelves.trending.length,
    trendingTop3: shelves.trending.slice(0, 3),
    newestTop3: shelves.newest.slice(0, 3),
    updatedTop3: shelves.updated.slice(0, 3),
  },
  hero: heroRows.map((r) => ({
    featured_type: r.featured_type,
    slot_rank: r.slot_rank,
    axis_rank: r.axis_rank,
    id: r.project_id,
    title: r.title,
    feedback_users_7d: r.feedback_users_7d,
    watchers_7d: r.watchers_7d,
    players_7d: r.players_7d,
    players_prev_7d: r.players_prev_7d,
    player_delta_7d: r.player_delta_7d,
    first_published_at: r.first_published_at,
    meaningful_update_at: r.meaningful_update_at,
    update_kind: r.update_kind,
  })),
  heroDuplicateCount: dupHero ? heroIds.length - new Set(heroIds).size : 0,
  missingTypes: ["reaction", "rising_plays", "newest", "updated"].filter(
    (t) => !heroRows.some((r) => r.featured_type === t),
  ),
};

const out =
  target === "production"
    ? ".tmp-prod-featured-hero-066.json"
    : ".tmp-staging-featured-hero-066.json";
writeFileSync(out, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
console.log(`wrote ${out}`);
