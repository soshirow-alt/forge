/**
 * Local read-only: compose 4-slot hero using service-role (mirrors Preview fallback).
 * HARD GUARD per argv: staging | production
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { pickFeaturedHeroSlots } from "../../lib/home-featured-hero-selection.ts";

const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";
const PROD_REF = "bpnisgzxuwdxelhnduuf";

function loadEnv(paths, { override = false } = {}) {
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
      if (override || !env[k]) env[k] = v;
    }
  }
  return env;
}

const target = (process.argv[2] || "staging").toLowerCase();
const expected = target === "production" ? PROD_REF : STAGING_REF;
const env =
  target === "production"
    ? loadEnv([".env.vercel.production"], { override: true })
    : loadEnv([".env.local", ".env.vercel.preview"]);
const url = (env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const anon = (env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
const service = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
if (!url || !anon) {
  console.error(JSON.stringify({ blocked: true, reason: "missing url/anon", target }));
  process.exit(2);
}
const ref = new URL(url).hostname.split(".")[0];
if (ref !== expected) {
  console.error(JSON.stringify({ blocked: true, ref, expected }));
  process.exit(2);
}

const anonClient = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const admin = service
  ? createClient(url, service, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

const { data: feedRows, error: feedErr } = await anonClient.rpc(
  "get_home_discovery_feed",
);
if (feedErr) {
  console.error(feedErr);
  process.exit(1);
}

const trending = feedRows
  .filter((r) => r.section === "trending")
  .sort((a, b) => a.rank - b.rank);
const updated = feedRows
  .filter((r) => r.section === "updated")
  .sort((a, b) => a.rank - b.rank);
const newest = feedRows
  .filter((r) => r.section === "newest")
  .sort((a, b) => a.rank - b.rank);

let rising = [];
if (admin) {
  const now = Date.now();
  const windowStart = new Date(now - 7 * 86400000).toISOString();
  const prevStart = new Date(now - 14 * 86400000).toISOString();
  const { data: plays } = await admin
    .from("project_play_sessions")
    .select("project_id, user_id, played_at")
    .not("user_id", "is", null)
    .gte("played_at", prevStart);
  const map = new Map();
  for (const row of plays || []) {
    const id = String(row.project_id);
    let acc = map.get(id);
    if (!acc) {
      acc = { cur: new Set(), prev: new Set(), last: null };
      map.set(id, acc);
    }
    const uid = String(row.user_id);
    if (row.played_at >= windowStart) {
      acc.cur.add(uid);
      if (!acc.last || row.played_at > acc.last) acc.last = row.played_at;
    } else if (row.played_at >= prevStart) {
      acc.prev.add(uid);
    }
  }
  rising = [...map.entries()]
    .map(([id, acc]) => ({
      id,
      featuredType: "rising_plays",
      axisRank: 0,
      players7d: acc.cur.size,
      playersPrev7d: acc.prev.size,
      playerDelta7d: acc.cur.size - acc.prev.size,
      lastPlayAt: acc.last,
    }))
    .filter((r) => r.players7d >= 1 && r.playerDelta7d > 0)
    .sort((a, b) => {
      if (b.playerDelta7d !== a.playerDelta7d)
        return b.playerDelta7d - a.playerDelta7d;
      if (b.players7d !== a.players7d) return b.players7d - a.players7d;
      return String(a.id).localeCompare(String(b.id));
    })
    .map((r, i) => ({ ...r, axisRank: i + 1 }));
}

const byType = {
  reaction: trending.map((r, i) => ({
    id: r.project_id,
    featuredType: "reaction",
    axisRank: r.rank || i + 1,
    title: r.title,
    feedbackUsers7d: r.feedback_users_7d,
    watchers7d: r.watchers_7d,
    players7d: r.players_7d,
  })),
  rising_plays: rising.map((r) => ({
    id: r.id,
    featuredType: "rising_plays",
    axisRank: r.axisRank,
    title: null,
    players7d: r.players7d,
    playersPrev7d: r.playersPrev7d,
    playerDelta7d: r.playerDelta7d,
    lastPlayAt: r.lastPlayAt,
  })),
  newest: newest.map((r, i) => ({
    id: r.project_id,
    featuredType: "newest",
    axisRank: r.rank || i + 1,
    title: r.title,
    firstPublishedAt: r.first_published_at,
  })),
  updated: updated.map((r, i) => ({
    id: r.project_id,
    featuredType: "updated",
    axisRank: r.rank || i + 1,
    title: r.title,
    meaningfulUpdateAt: r.meaningful_update_at,
  })),
};

const picked = pickFeaturedHeroSlots(byType);
const titleById = Object.fromEntries(
  [...trending, ...updated, ...newest].map((r) => [r.project_id, r.title]),
);

const report = {
  target,
  ref,
  hasServiceRole: Boolean(admin),
  shelfTop: {
    trending: trending.slice(0, 3).map((r) => ({
      id: r.project_id,
      title: r.title,
      fb7: r.feedback_users_7d,
      watch7: r.watchers_7d,
      play7: r.players_7d,
    })),
    updated: updated.slice(0, 3).map((r) => ({
      id: r.project_id,
      title: r.title,
      at: r.meaningful_update_at,
    })),
    newest: newest.slice(0, 3).map((r) => ({
      id: r.project_id,
      title: r.title,
      at: r.first_published_at,
    })),
  },
  risingTop: rising.slice(0, 5),
  hero: picked.map((p, i) => ({
    slot: i + 1,
    featuredType: p.featuredType,
    id: p.id,
    title: p.title || titleById[p.id] || null,
    axisRank: p.axisRank,
    feedbackUsers7d: p.feedbackUsers7d,
    watchers7d: p.watchers7d,
    players7d: p.players7d,
    playersPrev7d: p.playersPrev7d,
    playerDelta7d: p.playerDelta7d,
    firstPublishedAt: p.firstPublishedAt,
    meaningfulUpdateAt: p.meaningfulUpdateAt,
  })),
  missingTypes: ["reaction", "rising_plays", "newest", "updated"].filter(
    (t) => !picked.some((p) => p.featuredType === t),
  ),
  heroDupes: picked.length !== new Set(picked.map((p) => p.id)).size,
};

const out =
  target === "production"
    ? ".tmp-prod-featured-hero-compose.json"
    : ".tmp-staging-featured-hero-compose.json";
writeFileSync(out, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
