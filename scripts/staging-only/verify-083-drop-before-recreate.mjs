/**
 * Static guard: 083 must DROP existing home RPCs before recreating with
 * changed RETURNS TABLE (Postgres 42P13).
 *
 * Usage: node scripts/staging-only/verify-083-drop-before-recreate.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sqlPath = resolve(
  "supabase/migrations/083_player_ia_home_v0_shelves.sql",
);
const sql = readFileSync(sqlPath, "utf8");

const requiredDrops = [
  {
    name: "get_home_meaningful_updates",
    pattern:
      /DROP\s+FUNCTION\s+IF\s+EXISTS\s+public\.get_home_meaningful_updates\s*\(\s*integer\s*\)\s*;/i,
    reason: "080→083 OUT columns add update_label/update_summary/published_version",
  },
  {
    name: "get_home_newest_projects",
    pattern:
      /DROP\s+FUNCTION\s+IF\s+EXISTS\s+public\.get_home_newest_projects\s*\(\s*integer\s*,\s*text\s*\)\s*;/i,
    reason: "080→083 OUT columns add description",
  },
];

const requiredGrants = [
  /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.get_home_meaningful_updates\s*\(\s*integer\s*\)/i,
  /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.get_home_newest_projects\s*\(\s*integer\s*,\s*text\s*\)/i,
  /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.get_home_feedback_gathering_projects\s*\(\s*integer\s*\)/i,
];

const failures = [];

for (const item of requiredDrops) {
  if (!item.pattern.test(sql)) {
    failures.push(`missing DROP for ${item.name}: ${item.reason}`);
  } else {
    const dropIndex = sql.search(item.pattern);
    const createRe = new RegExp(
      `CREATE\\s+OR\\s+REPLACE\\s+FUNCTION\\s+public\\.${item.name}\\s*\\(`,
      "i",
    );
    const createIndex = sql.search(createRe);
    if (createIndex < 0) {
      failures.push(`missing CREATE for ${item.name}`);
    } else if (dropIndex > createIndex) {
      failures.push(`DROP for ${item.name} must appear before CREATE`);
    }
  }
}

for (const grant of requiredGrants) {
  if (!grant.test(sql)) {
    failures.push(`missing GRANT: ${grant}`);
  }
}

// New RPC — no prior OUT shape on Staging when 083 first succeeds; DROP not required.
if (!/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.get_home_feedback_gathering_projects\s*\(/i.test(sql)) {
  failures.push("missing CREATE for get_home_feedback_gathering_projects");
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      sqlPath,
      drops: requiredDrops.map((d) => d.name),
      note: "get_home_feedback_gathering_projects is new in 083 (no prior OUT change)",
    },
    null,
    2,
  ),
);
