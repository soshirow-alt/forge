/**
 * STAGING ONLY — broader read-only scan for possible initial publish devlogs.
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";
const PROD_REF = "bpnisgzxuwdxelhnduuf";

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
if (ref !== STAGING_REF || ref === PROD_REF) {
  console.error("Abort: not staging", ref);
  process.exit(1);
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: projects, error: pErr } = await sb
  .from("projects")
  .select("id, title, created_at, visibility, first_published_at, playable_version")
  .order("created_at", { ascending: true });
if (pErr) throw pErr;

const { data: devlogs, error: dErr } = await sb
  .from("project_devlogs")
  .select(
    "id, project_id, title, published_version, created_at, is_initial_publish, content",
  )
  .order("created_at", { ascending: true });
if (dErr) throw dErr;

const byProject = new Map();
for (const d of devlogs ?? []) {
  const list = byProject.get(d.project_id) ?? [];
  list.push(d);
  byProject.set(d.project_id, list);
}

const report = (projects ?? []).map((p) => {
  const logs = byProject.get(p.id) ?? [];
  const earliest = logs[0] ?? null;
  return {
    project_id: p.id,
    project_title: p.title,
    visibility: p.visibility,
    project_created_at: p.created_at,
    first_published_at: p.first_published_at,
    playable_version: p.playable_version,
    devlog_count: logs.length,
    earliest_devlog: earliest
      ? {
          id: earliest.id,
          title: earliest.title,
          published_version: earliest.published_version,
          created_at: earliest.created_at,
          is_initial_publish: earliest.is_initial_publish,
          content_preview: String(earliest.content ?? "").slice(0, 60),
          delta_ms_after_project:
            Date.parse(earliest.created_at) - Date.parse(p.created_at),
        }
      : null,
    title_match_初回公開: logs.filter((d) => d.title === "初回公開").map((d) => ({
      id: d.id,
      published_version: d.published_version,
      created_at: d.created_at,
      is_initial_publish: d.is_initial_publish,
    })),
  };
});

console.log(
  JSON.stringify(
    {
      ref,
      projectCount: report.length,
      totalDevlogs: (devlogs ?? []).length,
      heuristicExactCount: (devlogs ?? []).filter(
        (d) => d.title === "初回公開" && d.published_version === "0.1",
      ).length,
      projects: report,
    },
    null,
    2,
  ),
);
