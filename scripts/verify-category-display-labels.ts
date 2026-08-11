/**
 * Official user-facing category labels must stay:
 * ゲーム / 音楽・音声 / アセット / 開発ツール / サービス
 * Internal key `service-app` must not be renamed.
 *
 * Usage: npx tsx scripts/verify-category-display-labels.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  PROJECT_CATEGORY_IDS,
  PROJECT_CATEGORY_LABELS,
  PROJECT_CATEGORY_SELECTOR_LABELS,
} from "../lib/project-categories";
import { PLAYER_IA_HOME_FEATURE_CARDS } from "../lib/player-ia/home-feature-cards";
import { STUDIO_SUBMIT_CATEGORY_OPTIONS } from "../lib/studio-submit-category-options";
import { SUBMIT_PROTOTYPE_CATEGORY_LABEL } from "../lib/prototype/studio-submit-flow";

const ROOT = path.resolve(import.meta.dirname, "..");
const FORBIDDEN_COMPOUND = "サービス" + "・アプリ";
const FORBIDDEN_WEB_COMPOUND = "Webサービス" + "・アプリ";
const FORBIDDEN_EN = [/Service App/i, /service app/i];

const OFFICIAL_LABELS = {
  game: "ゲーム",
  audio: "音楽・音声",
  asset: "アセット",
  "dev-tool": "開発ツール",
  "service-app": "サービス",
} as const;

assert.deepEqual([...PROJECT_CATEGORY_IDS], [
  "game",
  "audio",
  "asset",
  "dev-tool",
  "service-app",
]);
assert.deepEqual(PROJECT_CATEGORY_LABELS, OFFICIAL_LABELS);
assert.equal(PROJECT_CATEGORY_SELECTOR_LABELS["service-app"], "サービス");
assert.equal(
  PLAYER_IA_HOME_FEATURE_CARDS.find((card) => card.id === "service-app")?.title,
  "サービス",
);
assert.equal(
  STUDIO_SUBMIT_CATEGORY_OPTIONS.find((option) => option.id === "service-app")
    ?.title,
  "サービス",
);
assert.equal(SUBMIT_PROTOTYPE_CATEGORY_LABEL.web_service, "サービス");

const UI_ROOTS = ["app", "components", "lib", "public"];
const ANNOUNCEMENT_FILES = [
  "scripts/production-rollout/2026-08/05_publish_release_announcement_LAST.sql",
  "scripts/production-ops/ops-publish-release-announcement-2026-08.sql",
  "scripts/staging-only/ops-publish-release-announcement-2026-08.sql",
];
const SCAN_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".svg",
  ".html",
]);

function walk(dir: string, out: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (SCAN_EXTENSIONS.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
}

const hits: string[] = [];
const files: string[] = [];
for (const rel of UI_ROOTS) {
  walk(path.join(ROOT, rel), files);
}
for (const rel of ANNOUNCEMENT_FILES) {
  files.push(path.join(ROOT, rel));
}

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const rel = path.relative(ROOT, file).replaceAll("\\", "/");
  if (text.includes(FORBIDDEN_COMPOUND) || text.includes(FORBIDDEN_WEB_COMPOUND)) {
    hits.push(`${rel}: forbidden category compound`);
  }
  for (const pattern of FORBIDDEN_EN) {
    if (pattern.test(text)) {
      hits.push(`${rel}: forbidden English category label`);
    }
  }
}

assert.equal(
  hits.length,
  0,
  `user-facing category label regression:\n${hits.join("\n")}`,
);

const categoriesSrc = fs.readFileSync(
  path.join(ROOT, "lib/project-categories.ts"),
  "utf8",
);
assert.match(categoriesSrc, /"service-app"/);

console.log("category-display-labels ok");
