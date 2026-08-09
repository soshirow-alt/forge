/**
 * Studio Preview must surface formal structured fields after section apply.
 * Usage: npx tsx scripts/verify-studio-preview-formal-attrs.ts
 */
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StudioSubmitPlayerPreview } from "../components/studio-submit-player-preview";
import {
  createEmptySubmitDraft,
  type SubmitDraftOwner,
} from "../lib/studio-submit-draft";
import {
  createEmptySubmitPrototypeCategoryFields,
} from "../lib/prototype/studio-submit-flow";
import { createEmptySubmitAssetCategoryFields } from "../lib/studio-non-game-attributes";
import { createEmptyPublishDestination } from "../lib/project-publish-links";

const OWNER: SubmitDraftOwner = {
  ownerId: "11111111-1111-4111-8111-111111111111",
  ownerName: "検証開発者",
  creator: "検証開発者",
};

const noop = () => {};

function baseDraft() {
  const draft = createEmptySubmitDraft();
  draft.title = "Preview formal 検証";
  draft.description = "キャッチ";
  draft.phase = "playable";
  draft.introduction = "紹介";
  draft.publishDestinations = [
    createEmptyPublishDestination({
      isPrimary: true,
      url: "https://example.com/play",
      kind: "self_site",
    }),
  ];
  return draft;
}

function htmlIncludes(html: string, snippets: string[]) {
  for (const snippet of snippets) {
    assert.ok(html.includes(snippet), `missing in preview HTML: ${snippet}`);
  }
}

// GAME playerCounts
{
  const draft = baseDraft();
  draft.genres = ["アクション"];
  draft.playerCounts = ["1人", "2人"];
  draft.estimatedPlayTime = "15〜30分";
  draft.playAccessType = "free";
  draft.playEnvironment = {
    pc: true,
    mobile: false,
    browser: false,
    distribution: "browser",
  };
  const html = renderToStaticMarkup(
    React.createElement(StudioSubmitPlayerPreview, {
      submitDraft: draft,
      submitOwner: OWNER,
      activeTab: "overview",
      onTabChange: noop,
    }),
  );
  htmlIncludes(html, ["プレイ人数", "1人", "2人"]);
}

// AUDIO moods / purposes
{
  const draft = baseDraft();
  const fields = createEmptySubmitPrototypeCategoryFields();
  fields.kinds = ["BGM"];
  fields.musicGenres = ["アンビエント"];
  fields.musicDuration = "2:00";
  fields.moods = ["穏やか"];
  fields.purposes = ["フィールド・探索"];
  fields.publishDestinations = [
    {
      id: "p1",
      kind: "自サイト",
      url: "https://example.com/a",
      isPrimary: true,
    },
  ];
  const html = renderToStaticMarkup(
    React.createElement(StudioSubmitPlayerPreview, {
      submitDraft: draft,
      submitOwner: OWNER,
      activeTab: "overview",
      onTabChange: noop,
      prototypeCategory: "music",
      prototypeCategoryFields: fields,
    }),
  );
  htmlIncludes(html, ["雰囲気", "穏やか", "用途", "フィールド・探索", "BGM", "アンビエント"]);
}

// ASSET kinds/formats/tastes/tools — no game play-info leak
{
  const draft = baseDraft();
  draft.estimatedPlayTime = "30分〜1時間";
  draft.playEnvironment = {
    pc: true,
    mobile: true,
    browser: true,
    distribution: "browser",
  };
  const assetFields = createEmptySubmitAssetCategoryFields();
  assetFields.kinds = ["キャラクター"];
  assetFields.formats = ["2D"];
  assetFields.tastes = ["ピクセルアート"];
  assetFields.tools = ["Aseprite"];
  const html = renderToStaticMarkup(
    React.createElement(StudioSubmitPlayerPreview, {
      submitDraft: draft,
      submitOwner: OWNER,
      activeTab: "overview",
      onTabChange: noop,
      commonFieldsOnly: true,
      categoryLabel: "アセット",
      assetFields,
    }),
  );
  htmlIncludes(html, [
    "アセット種別",
    "キャラクター",
    "表現形式",
    "2D",
    "テイスト",
    "ピクセルアート",
    "対応ツール",
    "Aseprite",
  ]);
  assert.doesNotMatch(html, /想定時間/);
  assert.doesNotMatch(html, /対応端末/);
}

// DEV-TOOL features
{
  const draft = baseDraft();
  const fields = createEmptySubmitPrototypeCategoryFields();
  fields.kinds = ["CLI"];
  fields.toolEnvironments = ["Windows"];
  fields.toolUsageMethod = "CLIで利用";
  fields.features = ["オープンソース"];
  fields.publishDestinations = [
    {
      id: "p1",
      kind: "自サイト",
      url: "https://example.com/t",
      isPrimary: true,
    },
  ];
  const html = renderToStaticMarkup(
    React.createElement(StudioSubmitPlayerPreview, {
      submitDraft: draft,
      submitOwner: OWNER,
      activeTab: "overview",
      onTabChange: noop,
      prototypeCategory: "dev_tool",
      prototypeCategoryFields: fields,
    }),
  );
  htmlIncludes(html, ["特徴", "オープンソース", "CLI", "Windows"]);
}

// SERVICE-APP features + purposes
{
  const draft = baseDraft();
  const fields = createEmptySubmitPrototypeCategoryFields();
  fields.kinds = ["Webサービス"];
  fields.purposes = ["制作支援"];
  fields.serviceEnvironments = ["Web"];
  fields.features = ["AI対応"];
  fields.publishDestinations = [
    {
      id: "p1",
      kind: "自サイト",
      url: "https://example.com/s",
      isPrimary: true,
    },
  ];
  const html = renderToStaticMarkup(
    React.createElement(StudioSubmitPlayerPreview, {
      submitDraft: draft,
      submitOwner: OWNER,
      activeTab: "overview",
      onTabChange: noop,
      prototypeCategory: "web_service",
      prototypeCategoryFields: fields,
    }),
  );
  htmlIncludes(html, ["特徴", "AI対応", "用途", "制作支援", "Webサービス"]);
}

console.log("studio-preview-formal-attrs ok");
