/**
 * Deterministic gate for Production rollout APPLY 01–03.
 *
 * Proves each APPLY file is a faithful ordered concatenation of canonical
 * migrations (076–101): section markers, UTF-8, no mojibake, no truncation,
 * normalized SQL body equality per migration.
 *
 * Schema outcome equivalence follows from statement identity (same SQL in the
 * same order). Full empty-DB dual apply is not used here because 076+ depends on
 * Production baseline ≤075 objects; suite gates cover semantic chunks separately.
 *
 * Never connects to Staging or Production.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  APPLY_BUNDLES,
  buildApplyFile,
  normalizeSql,
  stripTxn,
} from "./production-rollout/2026-08/rebuild-apply-bundles.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const rolloutDir = path.join(__dirname, "production-rollout", "2026-08");

const MOJIBAKE_MARKERS = [
  "\uFFFD",
  "ï¿½",
  "â€",
  "Ã©",
  "Ã¡",
  "ã",
  "ã‚",
  "æ–°ã",
  "ãƒ¡ãƒƒã‚»ãƒ¼ã‚¸",
];

function hasMojibake(text) {
  return MOJIBAKE_MARKERS.some((m) => text.includes(m));
}

function extractSection(applySql, migrationName) {
  const start = `-- === ${migrationName} ===`;
  const end = `-- === end ${migrationName} ===`;
  const i = applySql.indexOf(start);
  const j = applySql.indexOf(end);
  assert.ok(i >= 0, `missing start marker for ${migrationName}`);
  assert.ok(j > i, `missing end marker for ${migrationName}`);
  return applySql.slice(i + start.length, j).trim();
}

function assertUtf8NoBom(filePath, buf) {
  assert.equal(buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf, false, `${filePath}: unexpected UTF-8 BOM`);
  const text = buf.toString("utf8");
  assert.equal(Buffer.byteLength(text, "utf8"), buf.length, `${filePath}: not valid UTF-8 round-trip`);
  assert.equal(hasMojibake(text), false, `${filePath}: mojibake / replacement chars detected`);
  return text;
}

const report = {
  applyFiles: [],
  migrationsChecked: 0,
  proven: "PROVEN",
  method:
    "normalized per-migration SQL identity (canonical ↔ APPLY section) + UTF-8/mojibake/truncation/order checks",
};

for (const bundle of APPLY_BUNDLES) {
  const diskPath = path.join(rolloutDir, bundle.file);
  const diskBuf = fs.readFileSync(diskPath);
  const diskText = assertUtf8NoBom(bundle.file, diskBuf);
  const expected = buildApplyFile(bundle);

  assert.equal(
    normalizeSql(diskText),
    normalizeSql(expected),
    `${bundle.file}: disk APPLY diverges from rebuild of canonical migrations`,
  );

  assert.match(diskText, /^BEGIN;/m, `${bundle.file}: missing BEGIN`);
  assert.equal(
    (diskText.match(/^COMMIT;/gm) || []).length,
    1,
    `${bundle.file}: expected exactly one COMMIT`,
  );

  let prevEnd = -1;
  for (const name of bundle.migrations) {
    const section = extractSection(diskText, name);
    const canonical = stripTxn(
      fs.readFileSync(path.join(root, "supabase", "migrations", name), "utf8"),
    );
    assert.equal(
      normalizeSql(section),
      normalizeSql(canonical),
      `${bundle.file}: section body != canonical ${name}`,
    );
    assert.ok(section.length > 40, `${name}: section suspiciously short (truncation?)`);
    assert.equal(hasMojibake(section), false, `${name}: mojibake in section`);

    const startAt = diskText.indexOf(`-- === ${name} ===`);
    assert.ok(startAt > prevEnd, `${name}: out of order in ${bundle.file}`);
    prevEnd = diskText.indexOf(`-- === end ${name} ===`);
    report.migrationsChecked += 1;
  }

  // Japanese samples that previously mojibake-corrupted in APPLY 03
  if (bundle.file.startsWith("03_")) {
    assert.ok(
      diskText.includes("新しいメッセージが届きました") ||
        diskText.includes("メッセージ"),
      `${bundle.file}: expected Japanese messaging copy present`,
    );
  }

  report.applyFiles.push({
    file: bundle.file,
    bytes: diskBuf.length,
    migrations: bundle.migrations.length,
    encoding: "utf-8",
    completeness: "PASS",
  });
}

console.log(JSON.stringify(report, null, 2));
console.log("verify-production-rollout-bundle: PASS (PROVEN statement-level equivalence)");
