import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";
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
    return new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/i)?.[1] ?? null;
  } catch {
    return null;
  }
}

const env = loadEnv();
if (extractRef(env.NEXT_PUBLIC_SUPABASE_URL || "") !== STAGING_REF) {
  console.error("Abort: not staging");
  process.exit(1);
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const ids = [
  "cccccccc-cccc-4ccc-8ddd-000000000004",
  "cccccccc-cccc-4ccc-8ddd-000000000003",
  "41ff5a96-105c-42a2-87b4-787bcfeacb45",
  "aa910df8-afdf-4cbb-a00e-42a9518afc52",
];
const { data: stats, error: statsError } = await sb.rpc("get_public_project_stats", {
  p_project_ids: ids,
});
const { data: feed } = await sb.rpc("get_home_discovery_feed");
const feedById = {};
for (const row of feed ?? []) {
  feedById[row.project_id] ??= {
    title: row.title,
    feedback_participant_count: row.feedback_participant_count,
    watch_count: row.watch_count,
  };
}
const comparison = (stats ?? []).map((s) => ({
  id: s.project_id,
  title: feedById[s.project_id]?.title,
  statsFb: s.feedback_participant_count,
  statsWatch: s.watch_count,
  feedFb: feedById[s.project_id]?.feedback_participant_count,
  feedWatch: feedById[s.project_id]?.watch_count,
  match:
    s.feedback_participant_count === feedById[s.project_id]?.feedback_participant_count &&
    s.watch_count === feedById[s.project_id]?.watch_count,
}));
console.log(JSON.stringify({ statsError, comparison }, null, 2));
