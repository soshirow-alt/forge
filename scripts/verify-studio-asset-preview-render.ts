/**
 * Behavioral render via production Studio preview trees (not leaf-only wiring).
 * - Edit: GameDetailPlayerPreviewView (same chrome as GameDetailPlayerPreview)
 * - Submit: StudioSubmitPlayerPreview
 * Usage: npx tsx scripts/verify-studio-asset-preview-render.ts
 */
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GameDetailPlayerPreviewView } from "../components/game-detail-player-preview";
import { StudioSubmitPlayerPreview } from "../components/studio-submit-player-preview";
import { resolveGameDetailPlayerMeta } from "../lib/game-detail-player-meta";
import type { Game } from "../lib/mock-games";
import {
  DIST_BROWSER_TAG,
  ENV_MOBILE_TAG,
  ENV_PC_TAG,
} from "../lib/play-environment";
import {
  createEmptySubmitDraft,
  type SubmitDraftOwner,
} from "../lib/studio-submit-draft";
import {
  createEmptySubmitPrototypeCategoryFields,
  type SubmitPrototypeCategory,
} from "../lib/prototype/studio-submit-flow";
import { createEmptyPublishDestination } from "../lib/project-publish-links";

const OWNER: SubmitDraftOwner = {
  ownerId: "11111111-1111-4111-8111-111111111111",
  ownerName: "検証開発者",
  creator: "検証開発者",
};

const noopTab = () => {};

/** Intentionally game-populated — must NOT leak into asset play-info UI. */
function populatedGame(category: Game["category"]): Game {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    title: "プレビュー検証タイトル",
    genre: "アクション",
    genres: ["アクション", "RPG"],
    status: "試作ver",
    creator: OWNER.ownerName,
    phase: "playable",
    description: "キャッチコピーです",
    lookingForTesters: false,
    lastUpdated: "2026-08-09",
    section: "new",
    tags: ["アクション", "RPG", ENV_PC_TAG, ENV_MOBILE_TAG, DIST_BROWSER_TAG],
    playUrl: "https://example.com/play",
    itchUrl: "https://example.itch.io/demo",
    estimatedPlayTime: "30分〜1時間",
    playAccessType: "free",
    overviewIntroduction: "作品紹介の本文です。共通項目として残る必要があります。",
    category,
    ownerId: OWNER.ownerId,
    ownerName: OWNER.ownerName,
  };
}

function populatedDraft() {
  const draft = createEmptySubmitDraft();
  draft.title = "プレビュー検証タイトル";
  draft.description = "キャッチコピーです";
  draft.phase = "playable";
  draft.introduction = "作品紹介の本文です。共通項目として残る必要があります。";
  draft.genres = ["アクション", "RPG"];
  draft.estimatedPlayTime = "30分〜1時間";
  draft.playAccessType = "free";
  draft.playEnvironment = {
    pc: true,
    mobile: true,
    browser: true,
    distribution: "browser",
  };
  draft.publishDestinations = [
    createEmptyPublishDestination({
      isPrimary: true,
      kind: "itch",
      usageMethod: null,
      url: "https://example.itch.io/demo",
    }),
  ];
  return draft;
}

const metaProbe = resolveGameDetailPlayerMeta(populatedGame("game"));
assert.ok(metaProbe);
assert.ok(metaProbe.playAccessBadgeLabel);
assert.ok(metaProbe.playInfo.playTimeOptions.some((o) => o.active));
assert.ok(metaProbe.playInfo.deviceOptions.some((o) => o.active));
assert.ok(metaProbe.playInfo.playMethodOptions.some((o) => o.active));

function assertCommonVisible(html: string) {
  assert.match(html, /プレビュー検証タイトル/);
  assert.match(html, /キャッチコピーです/);
  assert.match(html, /作品紹介の本文です/);
  assert.match(html, /公開先/);
}

function assertGamePlayUiAbsent(html: string) {
  // Play-info card / placeholders / play-access badge — not publish CTA copy.
  assert.doesNotMatch(html, /プレイ情報/);
  assert.doesNotMatch(html, /想定時間/);
  assert.doesNotMatch(html, /対応端末/);
  assert.doesNotMatch(html, /遊び方未設定/);
  assert.doesNotMatch(html, /30分〜1時間/);
  assert.doesNotMatch(html, />無料</);
  assert.doesNotMatch(html, /無料で遊べる/);
}

function assertGamePlayUiPresent(html: string) {
  assert.match(html, /プレイ情報/);
  assert.match(html, /想定時間/);
  assert.match(html, /30分〜1時間/);
  assert.match(html, /対応端末/);
  assert.match(html, /ブラウザで遊ぶ/);
  assert.match(html, />無料</);
}

// --- Edit Studio preview (production view wiring) ---
const editAsset = renderToStaticMarkup(
  React.createElement(GameDetailPlayerPreviewView, {
    sourceGame: populatedGame("asset"),
    activeTab: "overview",
    onTabChange: noopTab,
  }),
);
assert.match(editAsset, /アセット/);
assertCommonVisible(editAsset);
assertGamePlayUiAbsent(editAsset);

const editGame = renderToStaticMarkup(
  React.createElement(GameDetailPlayerPreviewView, {
    sourceGame: populatedGame("game"),
    activeTab: "overview",
    onTabChange: noopTab,
  }),
);
assertCommonVisible(editGame);
assertGamePlayUiPresent(editGame);

// --- Submit Studio preview (production component) ---
const submitAsset = renderToStaticMarkup(
  React.createElement(StudioSubmitPlayerPreview, {
    submitDraft: populatedDraft(),
    submitOwner: OWNER,
    activeTab: "overview",
    onTabChange: noopTab,
    commonFieldsOnly: true,
    categoryLabel: "アセット",
  }),
);
assert.match(submitAsset, /アセット/);
assertCommonVisible(submitAsset);
assertGamePlayUiAbsent(submitAsset);

const submitGame = renderToStaticMarkup(
  React.createElement(StudioSubmitPlayerPreview, {
    submitDraft: populatedDraft(),
    submitOwner: OWNER,
    activeTab: "overview",
    onTabChange: noopTab,
    commonFieldsOnly: false,
  }),
);
assertCommonVisible(submitGame);
assertGamePlayUiPresent(submitGame);

// --- Non-game submit smoke: prototype card, not game「プレイ情報」 ---
for (const category of ["music", "dev_tool", "web_service"] as const) {
  const fields = createEmptySubmitPrototypeCategoryFields();
  fields.musicDuration = "3:21";
  fields.toolEnvironments = ["Windows"];
  fields.toolUsageMethod = "インストール";
  fields.serviceEnvironments = ["ブラウザ"];
  fields.publishDestinations = [
    {
      id: "p1",
      kind: "公式",
      url: "https://example.com",
      isPrimary: true,
    },
  ];
  const html = renderToStaticMarkup(
    React.createElement(StudioSubmitPlayerPreview, {
      submitDraft: populatedDraft(),
      submitOwner: OWNER,
      activeTab: "overview",
      onTabChange: noopTab,
      prototypeCategory: category satisfies SubmitPrototypeCategory,
      prototypeCategoryFields: fields,
      commonFieldsOnly: false,
    }),
  );
  assert.doesNotMatch(html, /プレイ情報/);
  assert.match(html, /音源情報|利用情報/);
}

console.log("verify-studio-asset-preview-render: PASS");
