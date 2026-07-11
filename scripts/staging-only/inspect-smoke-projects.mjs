/**
 * STAGING ONLY — inspect Smoke A/B columns for home-discovery seed template.
 */
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
    const m = new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

const env = loadEnv();
const ref = extractRef(env.NEXT_PUBLIC_SUPABASE_URL || "");
if (ref !== STAGING_REF) {
  console.error("Abort: not staging", ref);
  process.exit(1);
}

const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const { data, error } = await sb
  .from("projects")
  .select("*")
  .in("id", [
    "41ff5a96-105c-42a2-87b4-787bcfeacb45",
    "aa910df8-afdf-4cbb-a00e-42a9518afc52",
  ]);

if (error) {
  console.error(error);
  process.exit(1);
}

for (const row of data ?? []) {
  console.log(
    JSON.stringify(
      {
        id: row.id,
        title: row.title,
        keys: Object.keys(row).sort(),
        sample: {
          owner_id: row.owner_id,
          visibility: row.visibility,
          release_status: row.release_status,
          playable_version: row.playable_version,
          first_published_at: row.first_published_at,
          genre: row.genre,
          thumbnail_url: row.thumbnail_url,
        },
      },
      null,
      2,
    ),
  );
}
