/**
 * Staging-only verify for migration 075 (project_feedback_owner_reads).
 * HARD GUARD: only vuqpwvjvgyxffmvpfrxo
 *
 * Usage: node scripts/staging-only/verify-075-project-feedback-owner-reads.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";
const PROD_REF = "bpnisgzxuwdxelhnduuf";

function loadEnvFiles(paths) {
  const env = { ...process.env };
  for (const path of paths) {
    if (!existsSync(path)) continue;
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
      const key = trimmed.slice(0, eq).trim();
      if (!env[key]) env[key] = value;
    }
  }
  return env;
}

const env = loadEnvFiles([".env.local", ".env.vercel.preview", ".env.vercel"]);
const url = (env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

let urlRef = null;
try {
  urlRef = new URL(url).hostname.split(".")[0] || null;
} catch {
  urlRef = null;
}

if (urlRef !== STAGING_REF) {
  console.error(
    JSON.stringify({
      blocked: true,
      reason: "NEXT_PUBLIC_SUPABASE_URL is not staging",
      urlRef,
      expected: STAGING_REF,
      never: PROD_REF,
    }),
  );
  process.exit(2);
}

if (!serviceKey) {
  console.error(JSON.stringify({ blocked: true, reason: "SUPABASE_SERVICE_ROLE_KEY missing" }));
  process.exit(2);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const checks = [];

const { data: tableProbe, error: tableError } = await supabase
  .from("project_feedback_owner_reads")
  .select("project_id, owner_id, last_seen_at")
  .limit(1);

checks.push({
  name: "table_readable",
  ok: !tableError,
  error: tableError?.message ?? null,
  sample: tableProbe?.[0] ?? null,
});

const { error: rpcError } = await supabase.rpc("list_owned_public_feedback_unread_counts");
checks.push({
  name: "list_rpc_exists",
  // service role has no auth.uid — empty return or auth error both prove function exists
  ok: !rpcError || !String(rpcError.message).includes("Could not find the function"),
  error: rpcError?.message ?? null,
});

const { error: markMissingError } = await supabase.rpc("mark_project_public_feedback_seen", {
  p_project_id: "00000000-0000-0000-0000-000000000000",
});
checks.push({
  name: "mark_rpc_exists",
  ok:
    !markMissingError ||
    !String(markMissingError.message).includes("Could not find the function"),
  error: markMissingError?.message ?? null,
});

const failed = checks.filter((c) => !c.ok);
console.log(JSON.stringify({ targetRef: STAGING_REF, checks, pass: failed.length === 0 }, null, 2));
process.exit(failed.length === 0 ? 0 : 1);
