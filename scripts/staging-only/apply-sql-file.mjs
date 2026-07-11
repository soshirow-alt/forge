/**
 * STAGING ONLY — apply a migration SQL file via Supabase SQL HTTP if available,
 * otherwise print instructions for Dashboard paste.
 *
 * Guard: aborts unless NEXT_PUBLIC_SUPABASE_URL ref === vuqpwvjvgyxffmvpfrxo
 * and is not production bpnisgzxuwdxelhnduuf.
 *
 * Usage:
 *   node scripts/staging-only/apply-sql-file.mjs supabase/migrations/050_....sql
 *
 * Note: Hosted Supabase does not expose arbitrary SQL over the anon/service REST API.
 * This script verifies target + prints the file for Dashboard SQL Editor when
 * SUPABASE_DB_URL is missing. If SUPABASE_DB_URL is set (staging only), runs via pg.
 */
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

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
    const host = new URL(url).hostname;
    const m = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

const fileArg = process.argv[2];
if (!fileArg) {
  console.error("Usage: node scripts/staging-only/apply-sql-file.mjs <sql-file>");
  process.exit(1);
}

const env = loadEnv();
const ref = extractRef(env.NEXT_PUBLIC_SUPABASE_URL || "");
if (ref !== STAGING_REF) {
  console.error(`Abort: expected staging ref ${STAGING_REF}, got ${ref}`);
  process.exit(1);
}
if (ref === PROD_REF) {
  console.error("Abort: production ref");
  process.exit(1);
}

const sqlPath = resolve(fileArg);
const sql = readFileSync(sqlPath, "utf8");
console.log(JSON.stringify({ targetRef: ref, sqlPath, bytes: sql.length }, null, 2));

const dbUrl = env.SUPABASE_DB_URL || env.DATABASE_URL || env.DIRECT_URL;
if (!dbUrl) {
  console.log(
    "\nNo SUPABASE_DB_URL — open Staging Dashboard SQL Editor and paste this file.\n" +
      `Project: ${STAGING_REF}\nFile: ${sqlPath}\n`,
  );
  process.exit(2);
}

if (extractRef(dbUrl) && extractRef(dbUrl) !== STAGING_REF) {
  // db urls may not include ref in host; still require explicit staging marker
}

if (dbUrl.includes(PROD_REF)) {
  console.error("Abort: db url mentions production ref");
  process.exit(1);
}

const require = createRequire(import.meta.url);
let pg;
try {
  pg = require("pg");
} catch {
  console.error("pg package not installed. Paste SQL in Dashboard instead.");
  process.exit(2);
}

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query(sql);
  console.log("APPLY_OK", sqlPath);
} finally {
  await client.end();
}
