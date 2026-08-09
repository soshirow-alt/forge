/**
 * Static + PGlite verify for Staging 5-category seed enrichment (no DB write).
 * Does NOT rewrite tracked generator outputs — fails if they are stale.
 * Usage: npm run verify:staging-five-category-seed
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const stagingDir = path.join(root, "scripts", "staging-only");

const FORGE_GENRES = new Set([
  "RPG",
  "アクション",
  "アドベンチャー",
  "シミュレーション",
  "パズル",
  "ストラテジー",
  "ホラー",
  "ファンタジー",
  "SF",
  "サバイバル",
  "ノベル",
  "カードゲーム",
  "シューティング",
  "ローグライク",
  "クラフト",
  "探索",
  "経営",
  "カジュアル",
  "メトロイドヴァニア",
]);

const FORGE_FEATURE_TAGS = new Set([
  "ストーリー重視",
  "癒し系",
  "ストーリー",
  "インディー",
  "ピクセルアート",
  "レトロ",
  "協力プレイ",
  "ソロ向け",
  "短時間プレイ",
  "高難度",
  "PvP",
  "PvE",
]);

const PLAY_ENV_TAGS = new Set([
  "PC対応",
  "スマホ対応",
  "ブラウザ対応",
  "配布:外部リンク",
  "配布:ダウンロード",
  "配布:ブラウザプレイ",
  "安全確認",
  "テスター募集中",
]);

const trackedSeed = fs.readFileSync(
  path.join(stagingDir, "player-ia-staging-seed.sql"),
  "utf8",
);
const trackedCoverage = fs.readFileSync(
  path.join(stagingDir, "player-ia-staging-seed-coverage.json"),
  "utf8",
);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "forge-ia-seed-"));
const gen = spawnSync(
  process.execPath,
  [path.join(stagingDir, "generate-player-ia-staging-seed.mjs")],
  {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, FORGE_SEED_OUT_DIR: tmp },
  },
);
assert.equal(gen.status, 0, `generator failed:\n${gen.stderr || gen.stdout}`);

const regeneratedSeed = fs.readFileSync(
  path.join(tmp, "player-ia-staging-seed.sql"),
  "utf8",
);
const regeneratedCoverage = fs.readFileSync(
  path.join(tmp, "player-ia-staging-seed-coverage.json"),
  "utf8",
);

function normalizeSql(sql) {
  return sql.replace(/\r\n/g, "\n").trim();
}
function normalizeCoverage(raw) {
  const obj = JSON.parse(raw);
  delete obj.generatedAt;
  return JSON.stringify(obj);
}

assert.equal(
  normalizeSql(regeneratedSeed),
  normalizeSql(trackedSeed),
  "player-ia-staging-seed.sql is stale — re-run generator and commit outputs",
);
assert.equal(
  normalizeCoverage(regeneratedCoverage),
  normalizeCoverage(trackedCoverage),
  "player-ia-staging-seed-coverage.json is stale — re-run generator and commit outputs",
);

const coverage = JSON.parse(trackedCoverage);
const seedSql = trackedSeed;
const auditSql = fs.readFileSync(
  path.join(stagingDir, "audit-player-ia-five-category-search.sql"),
  "utf8",
);

assert.equal(coverage.validation.pass, true);
assert.equal(coverage.projects.total, 40);
assert.deepEqual(coverage.projects.byCategory, {
  game: 8,
  audio: 8,
  asset: 8,
  "dev-tool": 8,
  "service-app": 8,
});
assert.equal(coverage.projects.assetCommonFieldsOnly, true);
assert.deepEqual(coverage.projects.assetKinds, {});
assert.equal(coverage.projects.attributes.usable_for_creation, 25);
assert.equal(coverage.projects.attributes.looking_for_testers, 9);
assert.equal(coverage.projects.genreTagIntersections["ローグライク+ピクセルアート"], 2);
assert.equal(coverage.projects.genreTagIntersections["アクション+協力プレイ"], 1);
assert.equal(coverage.projects.genreTagIntersections["ローグライク+協力プレイ"], 0);

for (const genre of Object.keys(coverage.projects.gameGenreDist)) {
  assert.ok(FORGE_GENRES.has(genre), `non-official game genre: ${genre}`);
}
for (const tag of Object.keys(coverage.projects.gameFeatureTagDist)) {
  assert.ok(FORGE_FEATURE_TAGS.has(tag), `non-official feature tag: ${tag}`);
  assert.ok(!PLAY_ENV_TAGS.has(tag), `play-env tag leaked as feature: ${tag}`);
}

assert.doesNotMatch(seedSql, /\bSET\s+LOCAL\s+session_replication_role\b/i);
assert.match(seedSql, /DO NOT run on Production/);
assert.match(seedSql, /publish_destinations/);
assert.match(seedSql, /ON CONFLICT \(id\) DO NOTHING/);
assert.match(auditSql, /READ-ONLY/);
assert.doesNotMatch(auditSql, /\b(INSERT|UPDATE|DELETE|TRUNCATE)\b/i);
assert.ok(
  fs.existsSync(
    path.join(stagingDir, "player-ia-five-category-preview-e2e-checklist.md"),
  ),
);

const gate = spawnSync(
  process.execPath,
  [path.join(stagingDir, "local-sql-gate-player-ia-staging-seed.mjs")],
  { cwd: root, encoding: "utf8" },
);
assert.equal(
  gate.status,
  0,
  `seed PGlite gate failed:\n${gate.stderr || gate.stdout}`,
);
assert.match(gate.stdout, /"ok": true/);

console.log("verify-staging-five-category-seed: PASS");
