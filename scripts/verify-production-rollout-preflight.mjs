/**
 * Gate for Production rollout 00_preflight_READONLY.sql.
 *
 * Asserts the file is read-only, never FROM schema_migrations (42P01 when
 * the table is absent), and that section E reports TABLE_ABSENT / TABLE_PRESENT
 * via to_regclass only. Verdict must ignore history presence.
 *
 * Never connects to Staging or Production.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const preflightPath = path.join(
  __dirname,
  "production-rollout",
  "2026-08",
  "00_preflight_READONLY.sql",
);

const WRITE_RE =
  /\b(INSERT|UPDATE|DELETE|MERGE|CREATE|ALTER|DROP|TRUNCATE|GRANT|REVOKE|COPY|CALL)\b/i;

const DIRECT_HISTORY_FROM_RE =
  /\bFROM\s+supabase_migrations\.schema_migrations\b/i;

function stripSqlComments(sql) {
  return sql.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

function stripSqlStrings(sql) {
  return sql.replace(/'(?:''|[^'])*'/g, "''");
}

function extractSection(sql, startMarker, endMarker) {
  const i = sql.indexOf(startMarker);
  assert.ok(i >= 0, `missing section start: ${startMarker}`);
  const j = endMarker ? sql.indexOf(endMarker, i + startMarker.length) : sql.length;
  assert.ok(j > i, `missing section end: ${endMarker || "(eof)"}`);
  return sql.slice(i, j);
}

function extractSectionSelect(sectionSql) {
  const body = stripSqlComments(sectionSql).trim();
  const start = body.search(/\bSELECT\b/i);
  const end = body.lastIndexOf(";");
  assert.ok(start >= 0 && end > start, "section has no complete SELECT");
  return body.slice(start, end + 1).trim();
}

const sql = fs.readFileSync(preflightPath, "utf8");
assert.equal(sql.charCodeAt(0) === 0xfeff, false, "preflight has UTF-8 BOM");

const uncommented = stripSqlStrings(stripSqlComments(sql));
assert.equal(
  WRITE_RE.test(uncommented),
  false,
  "00_preflight_READONLY.sql must stay read-only (no INSERT/UPDATE/DELETE/DDL/GRANT)",
);
assert.equal(
  DIRECT_HISTORY_FROM_RE.test(uncommented),
  false,
  "00 must not FROM supabase_migrations.schema_migrations (42P01 when table absent)",
);
assert.match(sql, /migration_history_status/);
assert.match(sql, /TABLE_ABSENT/);
assert.match(sql, /TABLE_PRESENT/);
assert.match(sql, /to_regclass\(\s*'supabase_migrations\.schema_migrations'\s*\)/);

const fSection = extractSection(sql, "-- F.", "");
assert.equal(
  /schema_migrations|migration_history_status|TABLE_ABSENT/i.test(fSection),
  false,
  "F verdict must not depend on migration history table presence",
);
assert.match(fSection, /FAIL baseline/);
assert.match(fSection, /FAIL 076–101 objects already/);
assert.match(fSection, /PASS proceed to 01_core_schema_and_category\.sql/);

const eSection = extractSection(sql, "-- E.", "-- F.");
const eSql = extractSectionSelect(eSection);

const db = new PGlite();

const oldDirect = await db
  .query("SELECT version FROM supabase_migrations.schema_migrations")
  .then(
    () => {
      throw new Error("legacy FROM schema_migrations should 42P01 when absent");
    },
    (err) => err,
  );
assert.match(String(oldDirect?.code || oldDirect?.message || oldDirect), /42P01|does not exist/i);

const absent = await db.query(eSql);
assert.equal(absent.rows.length, 1, "E must return one row when history table is absent");
assert.equal(absent.rows[0].migration_history_status, "TABLE_ABSENT");
assert.equal(absent.rows[0].history_schema_exists, false);

await db.exec(`
  CREATE SCHEMA supabase_migrations;
  CREATE TABLE supabase_migrations.schema_migrations (
    version text PRIMARY KEY,
    name text,
    inserted_at timestamptz
  );
`);

const present = await db.query(eSql);
assert.equal(present.rows.length, 1, "E must return one row when history table exists");
assert.equal(present.rows[0].migration_history_status, "TABLE_PRESENT");
assert.equal(present.rows[0].history_schema_exists, true);

await db.close();

console.log(
  JSON.stringify(
    {
      file: "scripts/production-rollout/2026-08/00_preflight_READONLY.sql",
      read_only: true,
      direct_history_from: false,
      pglite_absent: "TABLE_ABSENT",
      pglite_present: "TABLE_PRESENT",
      verdict_ignores_history: true,
    },
    null,
    2,
  ),
);
