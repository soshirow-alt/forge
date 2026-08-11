/**
 * Gate for Production rollout 04_postflight_READONLY.sql.
 *
 * Asserts the file is read-only, never FROM schema_migrations (42P01 when
 * the table is absent), section E reports TABLE_ABSENT / TABLE_PRESENT via
 * to_regclass only, F verdict ignores history, and missing required objects
 * make F FAIL.
 *
 * Never connects to Staging or Production. Does not modify APPLY 01–03.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rolloutDir = path.join(__dirname, "production-rollout", "2026-08");
const postflightPath = path.join(rolloutDir, "04_postflight_READONLY.sql");

const WRITE_RE =
  /\b(INSERT|UPDATE|DELETE|MERGE|CREATE|ALTER|DROP|TRUNCATE|GRANT|REVOKE|COPY|CALL)\b/i;

const DIRECT_HISTORY_FROM_RE =
  /\bFROM\s+supabase_migrations\.schema_migrations\b/i;

const APPLY_FILES = [
  "01_core_schema_and_category.sql",
  "02_collaboration_and_messaging.sql",
  "03_notifications_email_and_finalization.sql",
];

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
  const start = body.search(/\b(WITH|SELECT)\b/i);
  const end = body.lastIndexOf(";");
  assert.ok(start >= 0 && end > start, "section has no complete SELECT");
  return body.slice(start, end + 1).trim();
}

const sql = fs.readFileSync(postflightPath, "utf8");
assert.equal(sql.charCodeAt(0) === 0xfeff, false, "postflight has UTF-8 BOM");

const uncommented = stripSqlStrings(stripSqlComments(sql));
assert.equal(
  WRITE_RE.test(uncommented),
  false,
  "04_postflight_READONLY.sql must stay read-only (no INSERT/UPDATE/DELETE/DDL/GRANT)",
);
assert.equal(
  DIRECT_HISTORY_FROM_RE.test(uncommented),
  false,
  "04 must not FROM supabase_migrations.schema_migrations (42P01 when table absent)",
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
assert.match(fSection, /FAIL review individual check_name/);
assert.match(fSection, /PASS schema objects present/);

const eSql = extractSectionSelect(extractSection(sql, "-- E.", "-- F."));
const fSql = extractSectionSelect(fSection);

const pairOnlyStub = `
CREATE TABLE public.collab_consultations (
  id uuid PRIMARY KEY,
  initiator_id uuid NOT NULL,
  counterpart_id uuid NOT NULL,
  status text NOT NULL
);
`;

const fullObjectStub = `
CREATE TABLE public.projects (
  id uuid PRIMARY KEY,
  category text NOT NULL
);
CREATE TABLE public.collab_consultations (
  id uuid PRIMARY KEY,
  initiator_id uuid NOT NULL,
  counterpart_id uuid NOT NULL,
  status text NOT NULL
);
CREATE UNIQUE INDEX collab_consultations_one_open_pair_uidx
  ON public.collab_consultations (initiator_id, counterpart_id)
  WHERE status = 'open';
CREATE TABLE public.transactional_email_outbox (
  id uuid PRIMARY KEY
);
CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY,
  notify_email boolean
);
CREATE TABLE public.platform_announcements (
  id uuid PRIMARY KEY,
  starts_at timestamptz
);
CREATE FUNCTION public.create_collab_consultation(uuid, text, text, uuid, uuid)
RETURNS void LANGUAGE sql AS $$ SELECT 1; $$;
CREATE FUNCTION public.list_my_collab_consultations()
RETURNS void LANGUAGE sql AS $$ SELECT 1; $$;
CREATE FUNCTION public.get_public_projects_by_category(
  text, text, boolean, boolean, boolean, text, text, integer, integer, text,
  text[], text[], text[], text[], text[], text[], text[], text[],
  text[], text[], text[], text[], text[], text[], text[], text[]
)
RETURNS void LANGUAGE sql AS $$ SELECT 1; $$;
`;

const dbAbsent = new PGlite();
const oldDirect = await dbAbsent
  .query("SELECT version FROM supabase_migrations.schema_migrations")
  .then(
    () => {
      throw new Error("legacy FROM schema_migrations should 42P01 when absent");
    },
    (err) => err,
  );
assert.match(String(oldDirect?.code || oldDirect?.message || oldDirect), /42P01|does not exist/i);

const absent = await dbAbsent.query(eSql);
assert.equal(absent.rows.length, 1);
assert.equal(absent.rows[0].migration_history_status, "TABLE_ABSENT");
assert.equal(absent.rows[0].history_schema_exists, false);
await dbAbsent.close();

const dbPresent = new PGlite();
await dbPresent.exec(`
  CREATE SCHEMA supabase_migrations;
  CREATE TABLE supabase_migrations.schema_migrations (
    version text PRIMARY KEY,
    name text
  );
`);
const present = await dbPresent.query(eSql);
assert.equal(present.rows.length, 1);
assert.equal(present.rows[0].migration_history_status, "TABLE_PRESENT");
assert.equal(present.rows[0].history_schema_exists, true);
await dbPresent.close();

const dbFail = new PGlite();
await dbFail.exec(pairOnlyStub);
const failVerdict = await dbFail.query(fSql);
assert.equal(failVerdict.rows.length, 1);
assert.match(failVerdict.rows[0].postflight_verdict, /^FAIL /);
await dbFail.close();

const dbPass = new PGlite();
await dbPass.exec(fullObjectStub);
const passVerdict = await dbPass.query(fSql);
assert.equal(passVerdict.rows.length, 1);
assert.match(passVerdict.rows[0].postflight_verdict, /^PASS /);

const stillAbsent = await dbPass.query(eSql);
assert.equal(stillAbsent.rows[0].migration_history_status, "TABLE_ABSENT");
assert.match(passVerdict.rows[0].postflight_verdict, /^PASS /);
await dbPass.close();

for (const file of APPLY_FILES) {
  assert.ok(fs.existsSync(path.join(rolloutDir, file)), `missing APPLY ${file}`);
}

console.log(
  JSON.stringify(
    {
      file: "scripts/production-rollout/2026-08/04_postflight_READONLY.sql",
      read_only: true,
      direct_history_from: false,
      pglite_absent: "TABLE_ABSENT",
      pglite_present: "TABLE_PRESENT",
      verdict_ignores_history: true,
      missing_objects: "FAIL",
      objects_present_history_absent: "PASS",
      apply_01_03_untouched_by_this_gate: true,
    },
    null,
    2,
  ),
);
