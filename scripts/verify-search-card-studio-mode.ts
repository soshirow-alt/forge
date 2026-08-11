/**
 * Behavioral checks: Search card visibility + Studio mode identity.
 * Usage: npx tsx scripts/verify-search-card-studio-mode.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PlayerIaProjectCard } from "../components/player-ia/player-ia-project-card";
import {
  FORGE_MODE_SWITCH_TO_PLAYER_LABEL,
  FORGE_MODE_SWITCH_TO_STUDIO_LABEL,
  FORGE_SHELL_BRAND_LABEL,
} from "../lib/forge-mode";
import { PROJECT_CATEGORY_IDS, PROJECT_CATEGORY_LABELS } from "../lib/project-categories";

const ROOT = path.resolve(import.meta.dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

// --- Labels ---
assert.equal(FORGE_SHELL_BRAND_LABEL.player, "Forge");
assert.equal(FORGE_SHELL_BRAND_LABEL.studio, "Forge Studio");
assert.equal(FORGE_MODE_SWITCH_TO_STUDIO_LABEL, "Studioへ");
assert.equal(FORGE_MODE_SWITCH_TO_PLAYER_LABEL, "Playerへ戻る");

// --- Search card render ---
const withDesc = renderToStaticMarkup(
  React.createElement(PlayerIaProjectCard, {
    projectId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    title: "短いタイトル",
    category: "game",
    description: "これは説明文です。作品の違いを判断するための抜粋。",
    creator: "Creator A",
    meta: "3日前",
  }),
);
assert.match(withDesc, /rounded-2xl/);
assert.match(withDesc, /border border-zinc-800/);
assert.match(withDesc, /bg-zinc-900/);
assert.match(withDesc, /これは説明文/);
assert.match(withDesc, /Creator A/);
assert.match(withDesc, /3日前/);
assert.match(withDesc, /ゲーム/);
assert.match(withDesc, /focus-visible:ring-2/);
assert.equal((withDesc.match(/<a /g) ?? []).length, 1);

const noDesc = renderToStaticMarkup(
  React.createElement(PlayerIaProjectCard, {
    projectId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    title: "説明なし",
    category: "audio",
    description: "   ",
    creator: "X",
  }),
);
assert.doesNotMatch(noDesc, /line-clamp-2 text-xs leading-relaxed text-zinc-500/);

const longTitle = "あ".repeat(80);
const longCreator = "LongCreatorName_".repeat(6);
const longCard = renderToStaticMarkup(
  React.createElement(PlayerIaProjectCard, {
    projectId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    title: longTitle,
    category: "service-app",
    description: "b".repeat(200),
    creator: longCreator,
    meta: "更新 1時間前",
  }),
);
assert.match(longCard, /line-clamp-2/);
assert.match(longCard, /サービス/);
assert.doesNotMatch(longCard, /サービス・アプリ/);
assert.match(longCard, /truncate/);

for (const category of PROJECT_CATEGORY_IDS) {
  const html = renderToStaticMarkup(
    React.createElement(PlayerIaProjectCard, {
      projectId: `dddddddd-dddd-4ddd-8ddd-${category.padEnd(12, "0").slice(0, 12)}`,
      title: `${category} title`,
      category,
    }),
  );
  assert.match(html, new RegExp(PROJECT_CATEGORY_LABELS[category]));
  assert.match(html, /\/games\//);
}

const cardSrc = read("components/player-ia/player-ia-project-card.tsx");
assert.match(cardSrc, /description/);
assert.match(cardSrc, /aspect-video/);
assert.match(cardSrc, /!absolute !inset-0/);
assert.doesNotMatch(cardSrc, /<Link[\s\S]*<Link/);

const searchSrc = read("components/player-ia/player-ia-search-page.tsx");
assert.match(searchSrc, /description=\{project\.description\}/);
assert.match(searchSrc, /max-w-\[1400px\]/);
assert.match(searchSrc, /2xl:grid-cols-3/);
assert.match(searchSrc, /PlayerIaSearchFilterPanel/);

// WorksSearchPage must remain Production path (not deleted / not replaced wholesale)
const works = read("components/works-search-page.tsx");
assert.match(works, /export function WorksSearchPage/);

// --- Studio mode ---
const studioShell = read("components/studio-shell.tsx");
assert.match(studioShell, /data-forge-mode="studio"/);
assert.match(studioShell, /FORGE_SHELL_BRAND_LABEL\.studio/);
assert.match(studioShell, /forge-nav-active/);
assert.match(studioShell, /mode="studio"/);
assert.doesNotMatch(studioShell, /breadcrumb|パンくず|aria-label="パンくず"/i);
assert.match(studioShell, /brandLabel=\{FORGE_SHELL_BRAND_LABEL\.studio\}/);

const playerShell = read("components/player-shell.tsx");
assert.match(playerShell, /data-forge-mode="player"/);
assert.match(playerShell, />Forge</);
assert.doesNotMatch(playerShell, /Forge Studio/);
assert.match(playerShell, /mode="player"/);
assert.match(playerShell, /forge-nav-active/);

const modeSwitch = read("components/forge-shell-mobile-nav.tsx");
assert.match(modeSwitch, /FORGE_MODE_SWITCH_TO_PLAYER_LABEL/);
assert.match(modeSwitch, /FORGE_MODE_SWITCH_TO_STUDIO_LABEL/);
assert.match(modeSwitch, /data-forge-mode=\{mode\}/);
assert.doesNotMatch(modeSwitch, /Player切り替え/);
assert.doesNotMatch(modeSwitch, /Studio切り替え/);

const globals = read("app/globals.css");
assert.match(globals, /\[data-forge-mode="studio"\]/);
assert.match(globals, /\[data-forge-mode="player"\]/);
assert.match(globals, /\.forge-mode-switch/);
assert.match(globals, /\.forge-nav-active/);
assert.match(globals, /--forge-accent:/);

const header = read("lib/forge-shell-header.ts");
assert.match(header, /forge-mode-switch/);
assert.doesNotMatch(header, /bg-violet-600/);

// Player accent must not be forced into studio token block as only violet
const studioBlock = globals.split('[data-forge-mode="studio"]')[1]?.split("[data-forge-mode")[0] ?? "";
assert.match(studioBlock, /#0284c7|#0ea5e9/);
assert.doesNotMatch(studioBlock, /#7c3aed/);

console.log("search-card-studio-mode ok");
