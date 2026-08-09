/**
 * 5-category Studio submit/edit smoke (mock / pure, no DB write).
 * Usage: npx tsx scripts/verify-studio-five-category-submit-edit.ts
 */
import assert from "node:assert/strict";
import { validateSubmitDraftForPost } from "../hooks/use-studio-submit";
import { planStudioSubmitWrite } from "../lib/studio-submit-write-plan";
import {
  createEmptySubmitPrototypeCategoryFields,
  type SubmitPrototypeCategory,
  type SubmitPrototypeCategoryFields,
} from "../lib/prototype/studio-submit-flow";
import {
  prototypeCategoryToProjectCategory,
  type SubmitAssetCategoryFields,
} from "../lib/studio-non-game-attributes";
import { submitFormToInsertRow, projectRowToGame } from "../lib/supabase/projects";
import { buildProjectEditFormDataFromGame } from "../lib/project-edit-form-data";
import { PROJECT_CATEGORY_IDS, type ProjectCategoryId } from "../lib/project-categories";
import { STUDIO_SUBMIT_CATEGORY_OPTIONS } from "../lib/studio-submit-category-options";
import type { ProjectRow } from "../lib/supabase/schema";
import {
  createEmptySubmitDraft,
} from "../lib/studio-submit-draft";
import { PLAYER_COUNT_OPTIONS } from "../lib/project-formal-filter-registry";

const owner = {
  ownerId: "11111111-1111-4111-8111-111111111111",
  ownerName: "Tester",
  creator: "Tester",
};

assert.deepEqual(
  STUDIO_SUBMIT_CATEGORY_OPTIONS.map((o) => o.id),
  [...PROJECT_CATEGORY_IDS],
);

function commonDraft() {
  const draft = createEmptySubmitDraft();
  draft.title = "五カテゴリ検証タイトル";
  draft.description = "キャッチコピーです";
  draft.phase = "playable";
  draft.introduction = "作品紹介の本文です。";
  draft.publishDestinations = [
    {
      id: "pub-1",
      kind: "other",
      url: "https://example.com/work",
      usageMethod: "other",
      isPrimary: true,
    },
  ];
  return draft;
}

function protoFields(
  category: SubmitPrototypeCategory,
): SubmitPrototypeCategoryFields {
  const base = createEmptySubmitPrototypeCategoryFields();
  if (category === "music") {
    return {
      ...base,
      kinds: ["楽曲"],
      musicGenres: ["ポップ"],
      musicDuration: "2:10",
      moods: ["明るい"],
      purposes: ["フィールド・探索"],
      publishDestinations: [
        {
          id: "a1",
          kind: "YouTube",
          url: "https://youtube.com/watch?v=x",
          isPrimary: true,
        },
      ],
    };
  }
  if (category === "dev_tool") {
    return {
      ...base,
      kinds: ["デスクトップツール"],
      toolUsageMethod: "ダウンロードして利用",
      toolEnvironments: ["Windows"],
      features: ["軽量"],
      publishDestinations: [
        {
          id: "t1",
          kind: "BOOTH",
          url: "https://booth.pm/demo",
          isPrimary: true,
        },
      ],
    };
  }
  return {
    ...base,
    kinds: ["Webサービス"],
    serviceEnvironments: ["Webブラウザ"],
    purposes: ["制作支援"],
    features: ["AI対応"],
    publishDestinations: [
      {
        id: "s1",
        kind: "自サイト",
        url: "https://example.com/app",
        isPrimary: true,
      },
    ],
  };
}

function assertRoundTrip(category: ProjectCategoryId, insertRow: Record<string, unknown>) {
  assert.equal(insertRow.category, category);
  const row = {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    owner_id: owner.ownerId,
    owner_name: owner.ownerName,
    title: insertRow.title,
    creator: owner.creator,
    genre: insertRow.genre ?? "",
    genres: insertRow.genres ?? [],
    description: insertRow.description,
    overview_introduction: insertRow.overview_introduction,
    overview_features: null,
    phase: insertRow.phase,
    status: insertRow.phase,
    looking_for_testers: false,
    tester_slots: null,
    section: "new",
    thumbnail_url: null,
    thumbnail_urls: [],
    tags: insertRow.tags ?? [],
    play_url: insertRow.play_url ?? "",
    steam_url: null,
    itch_url: null,
    github_url: null,
    discord_url: null,
    official_url: null,
    x_url: null,
    youtube_url: null,
    visibility: insertRow.visibility ?? "public",
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-02T00:00:00Z",
    category,
    category_attributes: insertRow.category_attributes ?? {},
    asset_kinds: [],
    playable_version: "1.0.0",
    release_status: "in_development",
    play_access_type: insertRow.play_access_type ?? "free",
    age_rating: "general",
    publish_destinations: insertRow.publish_destinations ?? [],
    related_links: [],
  } as unknown as ProjectRow;

  const game = projectRowToGame(row);
  assert.equal(game.category, category);
  const form = buildProjectEditFormDataFromGame(game);
  assert.equal(form.category, category);
}

// game
{
  const draft = commonDraft();
  draft.genres = ["RPG"];
  draft.playAccessType = "free";
  const validation = validateSubmitDraftForPost(draft);
  assert.equal(validation.ok, true);
  const form = planStudioSubmitWrite({ draft, owner });
  form.category = form.category ?? "game";
  const row = submitFormToInsertRow(
    { ...form, category: "game" },
    owner,
  );
  assert.equal(row.category, "game");
  assertRoundTrip("game", row as Record<string, unknown>);
}

// game playerCounts on create — canonical success, unknown reject, over-max
// reject. Save boundary is `normalizeFormalMultiForSave` (no baseline on
// create), not the silent-drop `parseAllowlistedMulti`.
{
  const draft = commonDraft();
  draft.genres = ["RPG"];
  draft.playAccessType = "free";
  draft.playerCounts = [PLAYER_COUNT_OPTIONS[0], PLAYER_COUNT_OPTIONS[1]];
  const validation = validateSubmitDraftForPost(draft);
  assert.equal(validation.ok, true, "canonical playerCounts on create must pass");
  const form = planStudioSubmitWrite({ draft, owner });
  assert.deepEqual(form.playerCounts, [PLAYER_COUNT_OPTIONS[0], PLAYER_COUNT_OPTIONS[1]]);
}
{
  const draft = commonDraft();
  draft.genres = ["RPG"];
  draft.playAccessType = "free";
  draft.playerCounts = [PLAYER_COUNT_OPTIONS[0], "存在しない人数区分"];
  const validation = validateSubmitDraftForPost(draft);
  assert.equal(
    validation.ok,
    false,
    "unknown playerCounts value on create must reject, not silently drop",
  );
}
{
  // player_count maxSelection equals PLAYER_COUNT_OPTIONS.length (every
  // canonical option can be selected at once), so a genuine over-max
  // create-time payload requires an unknown value beyond the allowlist —
  // exercised generically for `normalizeFormalMultiForSave` against a field
  // with headroom (audio_moods) in verify-studio-formal-sanitize-preserve.ts.
  // Here: selecting every canonical option at once (== max, not over) must
  // still pass, and duplicates must dedupe rather than push it over max.
  const draft = commonDraft();
  draft.genres = ["RPG"];
  draft.playAccessType = "free";
  draft.playerCounts = [...PLAYER_COUNT_OPTIONS, PLAYER_COUNT_OPTIONS[0]];
  const validation = validateSubmitDraftForPost(draft);
  assert.equal(validation.ok, true, "selecting every canonical option (deduped) must pass");
  const form = planStudioSubmitWrite({ draft, owner });
  assert.deepEqual(form.playerCounts, [...PLAYER_COUNT_OPTIONS]);
}

// asset common via real submit planner — no assetFields → validation fails closed
{
  const draft = commonDraft();
  draft.genres = [];
  const validation = validateSubmitDraftForPost(draft, {
    projectCategory: "asset",
  });
  assert.equal(validation.ok, false, "asset submit without kinds must fail closed");
}

// asset with structured kinds/formats/tastes/tools
{
  const draft = commonDraft();
  draft.genres = [];
  const assetFields: SubmitAssetCategoryFields = {
    kinds: ["キャラクター", "背景・風景"],
    formats: ["2D"],
    tastes: ["アニメ・トゥーン"],
    tools: ["Unity"],
  };
  const validation = validateSubmitDraftForPost(draft, {
    projectCategory: "asset",
    assetFields,
  });
  assert.equal(validation.ok, true);
  const form = planStudioSubmitWrite({
    draft,
    owner,
    projectCategory: "asset",
    assetFields,
  });
  const row = submitFormToInsertRow(form, owner);
  assert.deepEqual(row.category_attributes, {
    formats: ["2D"],
    tastes: ["アニメ・トゥーン"],
    tools: ["Unity"],
  });
  assert.deepEqual(row.asset_kinds, ["キャラクター", "背景・風景"]);
  assertRoundTrip("asset", row as Record<string, unknown>);
}

// audio / dev-tool / service-app
for (const proto of ["music", "dev_tool", "web_service"] as const) {
  const draft = commonDraft();
  const fields = protoFields(proto);
  const validation = validateSubmitDraftForPost(draft, {
    prototypeCategory: proto,
    prototypeFields: fields,
  });
  assert.equal(validation.ok, true, `${proto} validate`);
  const category = prototypeCategoryToProjectCategory(proto);
  const form = planStudioSubmitWrite({
    draft,
    owner,
    prototypeCategory: proto,
    prototypeFields: fields,
  });
  const row = submitFormToInsertRow(form, owner);
  assert.equal(row.category, category);
  assertRoundTrip(category, row as Record<string, unknown>);
}

console.log("studio-five-category-submit-edit ok");
