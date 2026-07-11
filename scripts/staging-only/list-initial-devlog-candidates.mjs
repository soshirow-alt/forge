/**
 * STAGING ONLY — read-only initial-devlog candidate listing.
 * Guard: vuqpwvjvgyxffmvpfrxo only. No writes.
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

const { data: candidates, error } = await sb
  .from("project_devlogs")
  .select(
    "id, project_id, title, published_version, created_at, is_initial_publish, content",
  )
  .eq("title", "初回公開")
  .eq("published_version", "0.1")
  .order("created_at", { ascending: true });

if (error) {
  console.error(error);
  process.exit(1);
}

const projectIds = [...new Set((candidates ?? []).map((r) => r.project_id))];
const { data: projects, error: pErr } = await sb
  .from("projects")
  .select("id, title, created_at, visibility, first_published_at, playable_version")
  .in(
    "id",
    projectIds.length ? projectIds : ["00000000-0000-0000-0000-000000000000"],
  );

if (pErr) {
  console.error(pErr);
  process.exit(1);
}

const byId = Object.fromEntries((projects ?? []).map((p) => [p.id, p]));

const rows = (candidates ?? []).map((d) => {
  const p = byId[d.project_id] ?? null;
  const contentPreview = String(d.content ?? "").slice(0, 80);
  const deltaMs =
    p?.created_at && d.created_at
      ? Date.parse(d.created_at) - Date.parse(p.created_at)
      : null;
  return {
    devlog_id: d.id,
    project_id: d.project_id,
    project_title: p?.title ?? null,
    visibility: p?.visibility ?? null,
    title: d.title,
    published_version: d.published_version,
    is_initial_publish: d.is_initial_publish,
    devlog_created_at: d.created_at,
    project_created_at: p?.created_at ?? null,
    first_published_at: p?.first_published_at ?? null,
    playable_version: p?.playable_version ?? null,
    delta_ms_after_project: deltaMs,
    content_preview: contentPreview,
  };
});

// Also count all devlogs per project for context
const enriched = [];
for (const row of rows) {
  const { count } = await sb
    .from("project_devlogs")
    .select("id", { count: "exact", head: true })
    .eq("project_id", row.project_id);
  const { data: sameTitle } = await sb
    .from("project_devlogs")
    .select("id")
    .eq("project_id", row.project_id)
    .eq("title", "初回公開")
    .eq("published_version", "0.1");
  enriched.push({
    ...row,
    project_devlog_count: count ?? null,
    same_pattern_count_on_project: sameTitle?.length ?? 0,
  });
}

console.log(
  JSON.stringify(
    {
      ref,
      candidateCount: enriched.length,
      candidates: enriched,
    },
    null,
    2,
  ),
);
