/**
 * Lightweight gate: cross-category common surfaces must not ship game-only CTA copy.
 * Does NOT ban the word ゲーム globally.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const TARGETS = [
  "lib/project-detail-category-chrome.ts",
  "lib/discovery-public-developers.ts",
  "lib/creator-activity-categories.ts",
  "components/developer-search-v0-page.tsx",
  "components/developer-list-card.tsx",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

for (const rel of TARGETS) {
  assert.ok(fs.existsSync(path.join(ROOT, rel)), `missing ${rel}`);
}

const chrome = read("lib/project-detail-category-chrome.ts");
assert.match(chrome, /聴いたあとにフィードバック/);
assert.match(chrome, /ツール情報/);
assert.match(chrome, /音源情報/);
assert.doesNotMatch(
  chrome.replace(/category === "game"[\s\S]*?return \{[\s\S]*?\};/, ""),
  /プレイ後にフィードバックする/,
);

const search = read("components/developer-search-v0-page.tsx");
assert.match(search, /クリエイターを探す/);
assert.match(search, /活動カテゴリ/);
assert.doesNotMatch(search, /ジャンル<\/legend>/);

const shell = read("components/player-shell.tsx");
assert.match(shell, /クリエイターを探す/);

const inbox = read("components/messages-inbox-page.tsx");
assert.doesNotMatch(inbox, /<PlayerShell/);

console.log("verify-category-neutrality-surface: PASS");
