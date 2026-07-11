/**
 * Staging read-only: count projects whose overview_introduction contains newlines.
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
    return new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/i)?.[1] ?? null;
  } catch {
    return null;
  }
}

const env = loadEnv();
const ref = extractRef(env.NEXT_PUBLIC_SUPABASE_URL || "");
if (ref !== STAGING_REF) {
  console.log(JSON.stringify({ ok: false, reason: "not_staging", ref }));
  process.exit(1);
}

const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);

const { data, error } = await sb
  .from("projects")
  .select("id, title, overview_introduction, description")
  .not("overview_introduction", "is", null)
  .limit(100);

if (error) {
  console.log(JSON.stringify({ ok: false, error: error.message }));
  process.exit(1);
}

const withNl = (data || []).filter((row) =>
  /[\r\n]/.test(row.overview_introduction || ""),
);

console.log(
  JSON.stringify(
    {
      ok: true,
      ref,
      scanned: (data || []).length,
      withOverviewNewlines: withNl.length,
      samples: withNl.slice(0, 5).map((row) => ({
        id: row.id,
        title: row.title,
        lf: (row.overview_introduction.match(/\n/g) || []).length,
        preview: row.overview_introduction
          .slice(0, 100)
          .replace(/\r/g, "\\r")
          .replace(/\n/g, "\\n"),
      })),
      savePathNote:
        "normalizeOverviewIntroduction / resolveDetailIntroduction use trim() only — internal newlines preserved",
    },
    null,
    2,
  ),
);
