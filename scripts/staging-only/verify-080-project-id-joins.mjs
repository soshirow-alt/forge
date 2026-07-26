#!/usr/bin/env node
/**
 * Static guard: 080 must not compare projects.id (uuid) to project_devlogs.project_id (text)
 * without casting the uuid side to text.
 *
 *   node scripts/staging-only/verify-080-project-id-joins.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const file = path.join(root, "supabase/migrations/080_player_ia_home_feed.sql");
const sql = fs.readFileSync(file, "utf8");
const lines = sql.split("\n");

/** @type {{ line: number, text: string, reason: string }[]} */
const failures = [];

for (let i = 0; i < lines.length; i++) {
  const text = lines[i];
  const line = i + 1;
  if (/\bp\.id\s*=\s*d\.project_id\b/.test(text) && !/p\.id::text/.test(text)) {
    failures.push({ line, text: text.trim(), reason: "uuid = text (devlog) without p.id::text" });
  }
  if (/\bd\.project_id\s*=\s*p\.id\b/.test(text) && !/p\.id::text/.test(text)) {
    failures.push({ line, text: text.trim(), reason: "text = uuid (devlog) without p.id::text" });
  }
}

const requiredSafe = [
  /INNER JOIN public\.projects p ON p\.id::text = d\.project_id/,
  /WHERE d\.project_id = p\.id::text/,
];
for (const re of requiredSafe) {
  if (!re.test(sql)) {
    failures.push({ line: 0, text: String(re), reason: "expected safe join pattern missing" });
  }
}

if (!/^BEGIN;/m.test(sql) || !/^COMMIT;/m.test(sql)) {
  failures.push({ line: 0, text: "BEGIN/COMMIT", reason: "080 must be one transaction" });
}

if (failures.length) {
  console.error("FAIL verify-080-project-id-joins");
  for (const f of failures) console.error(`  L${f.line}: ${f.reason}\n    ${f.text}`);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      file: "supabase/migrations/080_player_ia_home_feed.sql",
      rule: "devlog.project_id (text) joins via p.id::text; release_events stay uuid=uuid",
    },
    null,
    2,
  ),
);
