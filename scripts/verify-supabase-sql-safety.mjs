/**
 * Static Supabase SQL safety checks (no full SQL parser).
 * Strict failures are scoped to avoid false positives on legacy staging SQL.
 *
 * Usage: npm run verify:supabase-sql-safety
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, basename } from "node:path";

const root = process.cwd();
const failures = [];
const warnings = [];

function read(path) {
  return readFileSync(path, "utf8");
}

function listSqlFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".sql"))
    .map((name) => join(dir, name));
}

function rel(path) {
  return relative(root, path).replace(/\\/g, "/");
}

function stripSqlComments(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, "\n")
    .replace(/--[^\n]*/g, "");
}

function isStrictPlayerIaFile(name) {
  return /beautify-player-ia|audit-player-ia-home|player-ia-staging-seed-validate/i.test(
    name,
  );
}

const stagingDir = join(root, "scripts", "staging-only");
const migrationsDir = join(root, "supabase", "migrations");
const stagingSql = listSqlFiles(stagingDir);
const migrationSql = listSqlFiles(migrationsDir);

const writeHint =
  /\b(INSERT|UPDATE|DELETE|MERGE|TRUNCATE|CREATE\s+OR\s+REPLACE\s+FUNCTION|DROP\s+FUNCTION|ALTER\s+TABLE)\b/i;
const hasBegin = /\bBEGIN\s*;/i;
const hasCommit = /\bCOMMIT\s*;/i;
const productionGuard =
  /(bpnisgzxuwdxelhnduuf|DO NOT run on Production|Production ref|ABORT.*Production|wrong project\s*\/\s*Production)/i;

for (const file of stagingSql) {
  const name = rel(file);
  const base = basename(file);
  const raw = read(file);
  const body = stripSqlComments(raw);
  const isWrite = writeHint.test(body);
  const isAudit =
    /^audit-/i.test(base) ||
    /READ-ONLY|read-only|DO NOT run write/i.test(raw);

  // Universal high-confidence forbidden patterns
  if (
    /\bUPDATE\s+public\.project_devlogs\b/i.test(body) &&
    /\bcontent\s*=/i.test(body)
  ) {
    failures.push(
      `${name}: UPDATE public.project_devlogs.content (published body immutable)`,
    );
  }

  if (/\bDISABLE\s+TRIGGER\b/i.test(body) && isStrictPlayerIaFile(base)) {
    failures.push(`${name}: DISABLE TRIGGER is forbidden`);
  } else if (/\bDISABLE\s+TRIGGER\b/i.test(body)) {
    warnings.push(
      `${name}: DISABLE TRIGGER present (legacy?) — do not copy into new SQL`,
    );
  }

  if (/\bTRUNCATE\b/i.test(body) && isStrictPlayerIaFile(base)) {
    failures.push(`${name}: TRUNCATE is forbidden`);
  }

  if (
    /\bsession_replication_role\b/i.test(body) &&
    /beautify/i.test(base)
  ) {
    failures.push(
      `${name}: session_replication_role bypass forbidden in beautify SQL`,
    );
  }

  // Strict transaction / Production guard for Player IA beautify writes
  if (isWrite && !isAudit && /beautify-player-ia/i.test(base)) {
    if (!hasBegin.test(body) || !hasCommit.test(body)) {
      failures.push(`${name}: beautify write SQL must use BEGIN/COMMIT`);
    }
    if (!productionGuard.test(raw)) {
      failures.push(`${name}: missing Production hard-stop / abort wording`);
    }
    if (
      !/eeeeeeee-eeee-4eee-8eee/i.test(body) ||
      !/forge-ia-seed-v1/i.test(body)
    ) {
      failures.push(`${name}: must scope by seed UUID prefix and forge-ia-seed-v1`);
    }
    if (/\bUPDATE\s+public\.project_devlogs\b/i.test(body)) {
      failures.push(`${name}: must not UPDATE project_devlogs`);
    }
    if (/\bUPDATE\s+public\.project_release_events\b/i.test(body)) {
      failures.push(`${name}: must not UPDATE project_release_events`);
    }
    if (!/UPDATE allowlist/i.test(raw)) {
      failures.push(`${name}: header must document UPDATE allowlist`);
    }
  }

  // Weak UPDATE/DELETE without WHERE — only warn (SQL often spans lines)
  if (
    isWrite &&
    isStrictPlayerIaFile(base) &&
    /\bUPDATE\b/i.test(body) &&
    !/\bWHERE\b/i.test(body)
  ) {
    failures.push(`${name}: UPDATE without WHERE`);
  }
}

// 083 / home v0 OUT-change DROP + GRANT heuristic
for (const file of migrationSql) {
  const name = rel(file);
  if (!/083_player_ia_home_v0_shelves\.sql$/i.test(basename(file))) continue;
  const raw = read(file);

  const checks = [
    {
      label: "get_home_meaningful_updates",
      needsOut: /update_label|update_summary|published_version/i,
      create:
        /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.get_home_meaningful_updates\s*\(/i,
      drop: /DROP\s+FUNCTION\s+IF\s+EXISTS\s+public\.get_home_meaningful_updates\s*\(\s*integer\s*\)\s*;/i,
      grant:
        /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.get_home_meaningful_updates\s*\(\s*integer\s*\)/i,
    },
    {
      label: "get_home_newest_projects",
      needsOut: /description\s+text/i,
      create:
        /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.get_home_newest_projects\s*\(/i,
      drop: /DROP\s+FUNCTION\s+IF\s+EXISTS\s+public\.get_home_newest_projects\s*\(\s*integer\s*,\s*text\s*\)\s*;/i,
      grant:
        /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.get_home_newest_projects\s*\(\s*integer\s*,\s*text\s*\)/i,
    },
  ];

  for (const c of checks) {
    if (c.create.test(raw) && c.needsOut.test(raw) && !c.drop.test(raw)) {
      failures.push(
        `${name}: ${c.label} OUT change without exact-signature DROP`,
      );
    }
    if (c.create.test(raw) && !c.grant.test(raw)) {
      failures.push(`${name}: missing GRANT EXECUTE for ${c.label}`);
    }
  }

  if (!/\bBEGIN\s*;/i.test(raw) || !/\bCOMMIT\s*;/i.test(raw)) {
    failures.push(`${name}: migration should be wrapped in BEGIN/COMMIT`);
  }
}

// Soft sync hint for 079 (warning only)
const mig079 = join(migrationsDir, "079_global_public_search.sql");
const patch079 = join(stagingDir, "fix-079-search-public-catalog.sql");
if (existsSync(mig079) && existsSync(patch079)) {
  const a = read(mig079);
  const b = read(patch079);
  const marker = /tag_norm|v_norm/i;
  if (marker.test(a) !== marker.test(b)) {
    warnings.push(
      "079 migration vs fix-079 patch marker mismatch — confirm sync",
    );
  }
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures, warnings }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      checked: {
        stagingSql: stagingSql.length,
        migrations: migrationSql.length,
      },
      warnings,
    },
    null,
    2,
  ),
);
