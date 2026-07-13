/**
 * Apply SQL to Staging via Management API.
 * HARD GUARD: only vuqpwvjvgyxffmvpfrxo
 *
 * Usage: node scripts/staging-only/apply-sql-via-management.mjs [path-to.sql]
 * Requires SUPABASE_ACCESS_TOKEN in env or .env.local
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

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

const sqlPath = resolve(
  process.argv[2] || "supabase/migrations/064_shared_public_profile_avatar.sql",
);
const env = loadEnvFiles([".env.local", ".env.vercel.preview", ".env.vercel"]);
const token = (env.SUPABASE_ACCESS_TOKEN || "").trim();
const url = (env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
let urlRef = null;
try {
  urlRef = new URL(url).hostname.split(".")[0] || null;
} catch {
  urlRef = null;
}

if (urlRef && urlRef !== STAGING_REF) {
  console.error(
    JSON.stringify({
      blocked: true,
      reason: "NEXT_PUBLIC_SUPABASE_URL is not staging",
      urlRef,
      expected: STAGING_REF,
    }),
  );
  process.exit(2);
}

if (!token) {
  console.error(
    JSON.stringify({
      blocked: true,
      reason: "SUPABASE_ACCESS_TOKEN missing",
      next: `Paste SQL into Staging Dashboard SQL Editor (ref ${STAGING_REF}) OR set SUPABASE_ACCESS_TOKEN`,
      sqlPath,
      never: PROD_REF,
    }),
  );
  process.exit(2);
}

const sql = readFileSync(sqlPath, "utf8");
console.log(
  JSON.stringify({
    targetRef: STAGING_REF,
    sqlPath,
    bytes: sql.length,
    via: "management-api",
  }),
);

const res = await fetch(
  `https://api.supabase.com/v1/projects/${STAGING_REF}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  },
);
const text = await res.text();
console.log(JSON.stringify({ status: res.status, ok: res.ok, body: text.slice(0, 2000) }));
process.exit(res.ok ? 0 : 1);
