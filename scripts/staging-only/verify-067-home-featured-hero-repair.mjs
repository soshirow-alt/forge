/**
 * Staging-only read-only verify after Dashboard apply of
 * supabase/migrations/067_fix_home_featured_hero_sql_stable.sql
 *
 * Expect after successful repair:
 *   - anon rpc get_home_featured_hero succeeds (no 0A000 / DROP TABLE)
 *   - 0–4 rows, unique project_id, featured_type among the four slots
 *   - get_home_discovery_feed still works (shelves unchanged)
 *
 * Does not apply SQL. Does not touch Production.
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

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

const STAGING = "vuqpwvjvgyxffmvpfrxo";
const SLOT_TYPES = new Set([
  "reaction",
  "rising_plays",
  "newest",
  "updated",
]);

const env = loadEnv(".env.local");
const url = env.NEXT_PUBLIC_SUPABASE_URL || "";
if (!url || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error(JSON.stringify({ ok: false, reason: "missing_env" }));
  process.exit(2);
}

const ref = new URL(url).hostname.split(".")[0];
if (ref !== STAGING) {
  console.error(JSON.stringify({ ok: false, blocked: true, ref, expected: STAGING }));
  process.exit(2);
}

const sb = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const hero = await sb.rpc("get_home_featured_hero");
const feed = await sb.rpc("get_home_discovery_feed");

const heroRows = Array.isArray(hero.data) ? hero.data : [];
const ids = heroRows.map((r) => r.project_id);
const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
const badTypes = heroRows
  .map((r) => r.featured_type)
  .filter((t) => !SLOT_TYPES.has(t));

const errMsg = hero.error?.message || "";
const stillBroken =
  Boolean(hero.error) &&
  (/DROP TABLE/i.test(errMsg) ||
    /0A000/i.test(errMsg) ||
    /non-volatile/i.test(errMsg));

const ok =
  !hero.error &&
  !feed.error &&
  heroRows.length <= 4 &&
  dup.length === 0 &&
  badTypes.length === 0 &&
  !stillBroken;

const report = {
  ok,
  ref,
  stillBrokenPlpgsqlTempDraft: stillBroken,
  heroError: hero.error,
  feedError: feed.error,
  heroCount: heroRows.length,
  heroDupProjectIds: dup,
  unexpectedFeaturedTypes: badTypes,
  hero: heroRows.map((r) => ({
    featured_type: r.featured_type,
    slot_rank: r.slot_rank,
    project_id: r.project_id,
    title: r.title,
    owner_id: r.owner_id,
    feedback_users_7d: r.feedback_users_7d,
    players_7d: r.players_7d,
    player_delta_7d: r.player_delta_7d,
  })),
  expectations: {
    heroRpc: "succeed without 0A000 / DROP TABLE",
    heroRows: "0–4 unique project_id slots",
    featured_type: "reaction | rising_plays | newest | updated",
    shelves: "get_home_discovery_feed still succeeds",
  },
};

console.log(JSON.stringify(report, null, 2));
process.exit(ok ? 0 : 1);
