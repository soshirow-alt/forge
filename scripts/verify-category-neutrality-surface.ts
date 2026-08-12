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
  "components/player-ia/player-ia-global-search-input.tsx",
  "components/player-ia/player-ia-global-search-page.tsx",
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
assert.match(chrome, /audio: "headphones"/);
assert.match(chrome, /asset: "eye"/);
assert.match(chrome, /"dev-tool": "wrench"/);
assert.match(chrome, /"service-app": "external-link"/);
assert.match(chrome, /primaryCtaIcon: "play"/);
assert.match(chrome, /feedbackCtaLabelLoggedIn: "フィードバックする"/);
assert.doesNotMatch(chrome, /プレイ後にフィードバックする/);
assert.match(chrome, /asset: "アセットを見る"/);
assert.doesNotMatch(chrome, /素材を見る/);

const detailPage = read("components/game-detail-v0-page.tsx");
assert.match(detailPage, /showDeveloperFollow/);
assert.match(detailPage, /handleToggleDeveloperFollow/);
assert.match(detailPage, /categoryChrome\.followCreatorLabel/);
// Creator follow stays on sidebar creator card only — no Heart in header retention row.
assert.doesNotMatch(detailPage, /\bHeart\b/);
assert.match(
  detailPage,
  /game\.developer\.bio[\s\S]*?showDeveloperFollow \? \([\s\S]*?followCreatorLabel[\s\S]*?制作・利用について/,
);

const search = read("components/developer-search-v0-page.tsx");
assert.match(search, /クリエイターを探す/);
assert.match(search, /活動カテゴリ/);
assert.doesNotMatch(search, /ジャンル<\/legend>/);

const shell = read("components/player-shell.tsx");
assert.match(shell, /クリエイターを探す/);

const globalInput = read("components/player-ia/player-ia-global-search-input.tsx");
assert.match(globalInput, /作品・クリエイター・タグを検索/);
assert.doesNotMatch(globalInput, /作品・開発者・タグを検索/);
assert.doesNotMatch(globalInput, /\? "開発者"/);

const globalPage = read("components/player-ia/player-ia-global-search-page.tsx");
assert.match(globalPage, /クリエイター/);
assert.doesNotMatch(globalPage, /\? "開発者"/);

const detail = read("components/game-detail-v0-page.tsx");
assert.match(detail, /PrimaryCtaIcon/);
assert.match(detail, /categoryChrome\.primaryCtaIcon/);

const inbox = read("components/messages-inbox-page.tsx");
assert.doesNotMatch(inbox, /<PlayerShell/);

console.log("verify-category-neutrality-surface: PASS");
