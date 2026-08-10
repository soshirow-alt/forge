import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const candidates = [
  "scripts/staging-only/seed-featured-hero-visibility.sql",
  "scripts/staging-only/audit-featured-hero-visibility.sql",
];
const gatePath =
  "scripts/staging-only/local-sql-gate-featured-hero-seed.mjs";
for (const path of candidates) {
  assert.equal(existsSync(join(process.cwd(), path)), true, `${path} is missing`);
  const sql = readFileSync(join(process.cwd(), path), "utf8");
  assert.match(sql, /Staging|STAGING|staging/);
}
const seed = readFileSync(join(process.cwd(), candidates[0]), "utf8");
assert.match(seed, /BEGIN;/);
assert.match(seed, /COMMIT;/);
assert.match(seed, /RAISE EXCEPTION/);
assert.equal(existsSync(join(process.cwd(), gatePath)), true, `${gatePath} is missing`);
const packageJson = JSON.parse(
  readFileSync(join(process.cwd(), "package.json"), "utf8"),
) as { scripts?: Record<string, string> };
assert.equal(
  packageJson.scripts?.["verify:featured-hero-seed-sql-gate"],
  "node scripts/staging-only/local-sql-gate-featured-hero-seed.mjs",
);
const gate = readFileSync(join(process.cwd(), gatePath), "utf8");
assert.match(gate, /seed-featured-hero-visibility\.sql/);
assert.match(gate, /067_fix_home_featured_hero_sql_stable\.sql/);
assert.match(gate, /featured hero seed first apply/);
assert.match(gate, /featured hero seed safe re-run/);
assert.match(gate, /intentionalMidFileFailureRolledBack/);
assert.match(gate, /exactFourAxisProjectPairs/);
console.log("PASS verify-featured-hero-seed-contract");
