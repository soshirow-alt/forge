/**
 * Asset common-fields-only Studio submit/edit round-trip (mock DB, no write).
 * Usage: npx tsx scripts/verify-studio-asset-common-fields.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createEmptySubmitDraft,
} from "../lib/studio-submit-draft";
import { validateSubmitDraftForPost } from "../hooks/use-studio-submit";
import { planStudioSubmitWrite } from "../lib/studio-submit-write-plan";
import { resolveStudioPreviewCategoryChrome } from "../lib/studio-preview-category-chrome";
import {
  submitFormToInsertRow,
  updateProjectDetailsInDb,
  projectRowToGame,
  insertProject,
} from "../lib/supabase/projects";
import { buildProjectEditFormDataFromGame } from "../lib/project-edit-form-data";
import { buildGamePublicationEditPersistPayload } from "../lib/studio-game-overview-edit-persist";
import { isStudioCommonFieldsOnlyCategory } from "../lib/studio-category-mode";
import {
  STUDIO_SUBMIT_CATEGORY_OPTIONS,
  studioSubmitHrefForCategory,
} from "../lib/studio-submit-category-options";
import { PROJECT_CATEGORY_IDS } from "../lib/project-categories";
import { EMPTY_PLAY_ENVIRONMENT_FORM } from "../lib/play-environment";
import type { Game } from "../lib/mock-games";
import type { ProjectRow } from "../lib/supabase/schema";
import { createEmptyPublishDestination } from "../lib/project-publish-links";
import { parseCategoryAttributes } from "../lib/project-categories";

const ROOT = path.resolve(import.meta.dirname, "..");
const PROJECT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OWNER_ID = "11111111-1111-4111-8111-111111111111";

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

assert.equal(isStudioCommonFieldsOnlyCategory("asset"), true);
assert.equal(isStudioCommonFieldsOnlyCategory("game"), false);
assert.equal(isStudioCommonFieldsOnlyCategory("audio"), false);

assert.deepEqual(
  STUDIO_SUBMIT_CATEGORY_OPTIONS.map((o) => o.id),
  [...PROJECT_CATEGORY_IDS],
);
assert.equal(
  studioSubmitHrefForCategory("asset"),
  "/studio/submit?view=category-proto&category=asset",
);

const pickSrc = read("components/studio-submit-category-pick.tsx");
assert.match(pickSrc, /STUDIO_SUBMIT_CATEGORY_OPTIONS/);
assert.doesNotMatch(pickSrc, /asset_kinds|AssetKind|usable_for_creation|quick_try/);

const panelSrc = read("components/studio-submit-panel.tsx");
assert.match(panelSrc, /commonFieldsOnly/);
assert.doesNotMatch(panelSrc, /asset_kinds/);

const previewSrc = read("components/studio-submit-player-preview.tsx");
assert.match(previewSrc, /resolveStudioPreviewCategoryChrome|commonFieldsOnly/);
assert.match(previewSrc, /showPlayAccessBadge/);
assert.match(previewSrc, /アセット/);

const editPreviewSrc = read("components/game-detail-player-preview.tsx");
assert.match(editPreviewSrc, /export function GameDetailPlayerPreviewView/);
assert.match(editPreviewSrc, /resolveStudioPreviewCategoryChrome/);
assert.match(editPreviewSrc, /studioPreviewPlayInfoCardProp/);
assert.match(editPreviewSrc, /showPlayAccessBadge/);
assert.match(editPreviewSrc, /categoryPillLabel/);
assert.match(editPreviewSrc, /showUnsetPlayPlaceholders/);
assert.match(
  read("components/studio-submit-player-preview.tsx"),
  /studioPreviewPlayInfoCardProp/,
);

const chromeAsset = resolveStudioPreviewCategoryChrome({ category: "asset" });
assert.equal(chromeAsset.commonFieldsOnly, true);
assert.equal(chromeAsset.showGenreEditTarget, false);
assert.equal(chromeAsset.showPlayAccessEditTarget, false);
assert.equal(chromeAsset.showUnsetPlayPlaceholders, false);
assert.equal(chromeAsset.showGamePlayInfoCard, false);
assert.equal(chromeAsset.categoryPillLabel, "アセット");
assert.ok(chromeAsset.blockedEditTargets.includes("genres"));
assert.ok(chromeAsset.blockedEditTargets.includes("play-access"));
assert.ok(chromeAsset.blockedEditTargets.includes("play-info"));

const chromeGame = resolveStudioPreviewCategoryChrome({ category: "game" });
assert.equal(chromeGame.commonFieldsOnly, false);
assert.equal(chromeGame.showGenreEditTarget, true);
assert.equal(chromeGame.showPlayAccessEditTarget, true);
assert.equal(chromeGame.showGamePlayInfoCard, true);

function assetDraft() {
  const draft = createEmptySubmitDraft();
  draft.title = "アセット共通投稿テスト";
  draft.description = "キャッチコピーです";
  draft.phase = "playable";
  draft.introduction = "作品紹介の本文です。";
  draft.genres = [];
  draft.featureTags = [];
  draft.playEnvironment = { ...EMPTY_PLAY_ENVIRONMENT_FORM };
  // leave playAccessType unspecified for asset common path
  draft.publishDestinations = [
    {
      id: "pub-1",
      kind: "other",
      url: "https://example.com/asset",
      usageMethod: "other",
      isPrimary: true,
    },
  ];
  draft.visibility = "public";
  return draft;
}

const owner = {
  ownerId: OWNER_ID,
  ownerName: "Tester",
  creator: "Tester",
};

// validation: common only — no genre / playAccess / non-game kind rules
{
  const draft = assetDraft();
  const ok = validateSubmitDraftForPost(draft, { projectCategory: "asset" });
  assert.equal(ok.ok, true, "asset common draft should validate");

  const missingTitle = assetDraft();
  missingTitle.title = "";
  const failTitle = validateSubmitDraftForPost(missingTitle, {
    projectCategory: "asset",
  });
  assert.equal(failTitle.ok, false);

  // game rules must NOT apply
  const noGenre = assetDraft();
  noGenre.genres = [];
  assert.equal(
    validateSubmitDraftForPost(noGenre, { projectCategory: "asset" }).ok,
    true,
  );
}

// planner → row shape (sync) — insertProject async covered in main()
{
  const draft = assetDraft();
  const form = planStudioSubmitWrite({
    draft,
    owner,
    projectCategory: "asset",
  });
  const row = submitFormToInsertRow(form, owner, { deferThumbnails: true });
  assert.equal(row.category, "asset");
  assert.deepEqual(row.category_attributes, {});
  assert.ok(!("asset_kinds" in row));
  assert.equal(row.play_url, "https://example.com/asset");
  const parsed = parseCategoryAttributes(row.category_attributes);
  assert.equal(parsed.assetKinds, undefined);
}

type MockState = { updatePayloads: Record<string, unknown>[]; updateCalls: number };

function createProjectsSupabaseMock(): {
  supabase: SupabaseClient;
  state: MockState;
} {
  const state: MockState = { updatePayloads: [], updateCalls: 0 };
  const supabase = {
    from(table: string) {
      assert.equal(table, "projects");
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => ({
                  data: { thumbnail_url: null, thumbnail_urls: [] },
                  error: null,
                }),
              };
            },
          };
        },
        update(payload: Record<string, unknown>) {
          state.updateCalls += 1;
          state.updatePayloads.push(JSON.parse(JSON.stringify(payload)));
          return {
            eq() {
              return {
                select() {
                  return {
                    single: async () => ({
                      data: {
                        id: PROJECT_ID,
                        owner_id: OWNER_ID,
                        owner_name: "Tester",
                        title: String(payload.title ?? "Title"),
                        creator: "Tester",
                        genre: String(payload.genre ?? ""),
                        genres: (payload.genres as string[]) ?? [],
                        description: String(payload.description ?? "desc"),
                        overview_introduction: null,
                        phase: String(payload.phase ?? "playable"),
                        status: String(payload.status ?? "playable"),
                        looking_for_testers: false,
                        tester_slots: null,
                        section: "new",
                        thumbnail_url: null,
                        tags: (payload.tags as string[]) ?? [],
                        play_url: String(payload.play_url ?? ""),
                        steam_url: null,
                        itch_url: null,
                        github_url: null,
                        discord_url: null,
                        official_url: null,
                        visibility: String(payload.visibility ?? "public"),
                        created_at: "2026-08-01T00:00:00Z",
                        updated_at: "2026-08-02T00:00:00Z",
                        category: String(payload.category ?? "asset"),
                        category_attributes: payload.category_attributes ?? {},
                        asset_kinds: [],
                        playable_version: "1.0.0",
                        release_status: "in_development",
                        play_access_type: "free",
                        age_rating: "general",
                      },
                      error: null,
                    }),
                  };
                },
              };
            },
          };
        },
      };
    },
  };
  return { supabase: supabase as unknown as SupabaseClient, state };
}

function assetGame(): Game {
  return {
    id: PROJECT_ID,
    title: "アセット共通投稿テスト",
    creator: "Tester",
    genres: [],
    genre: "",
    description: "キャッチコピーです",
    overviewIntroduction: "作品紹介の本文です。",
    overviewFeatures: null,
    phase: "playable",
    status: "playable",
    lookingForTesters: false,
    lastUpdated: "2026-08-01",
    createdAt: "2026-08-01T00:00:00Z",
    section: "new",
    thumbnailUrls: [],
    tags: ["古いレガシータグ"],
    playUrl: "https://example.com/asset",
    ownerId: OWNER_ID,
    ownerName: "Tester",
    visibility: "public",
    playableVersion: "1.0.0",
    releaseStatus: "in_development",
    playAccessType: "free",
    ageRating: "general",
    category: "asset",
    categoryAttributes: {},
    publishDestinations: [
      createEmptyPublishDestination({
        id: "pub-1",
        kind: "other",
        url: "https://example.com/asset",
        usageMethod: "other",
        isPrimary: true,
      }),
    ],
  };
}

// hydration: category stays asset; empty attrs; no game fallback category
{
  const row = {
    id: PROJECT_ID,
    owner_id: OWNER_ID,
    owner_name: "Tester",
    title: "アセット共通投稿テスト",
    creator: "Tester",
    genre: "",
    genres: [],
    description: "キャッチコピーです",
    overview_introduction: "作品紹介の本文です。",
    overview_features: null,
    phase: "playable",
    status: "playable",
    looking_for_testers: false,
    tester_slots: null,
    section: "new",
    thumbnail_url: null,
    thumbnail_urls: [],
    tags: [],
    play_url: "https://example.com/asset",
    steam_url: null,
    itch_url: null,
    github_url: null,
    discord_url: null,
    official_url: null,
    x_url: null,
    youtube_url: null,
    visibility: "public",
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-02T00:00:00Z",
    category: "asset",
    category_attributes: {},
    asset_kinds: [],
    playable_version: "1.0.0",
    release_status: "in_development",
    play_access_type: "free",
    age_rating: "general",
    publish_destinations: [
      {
        id: "pub-1",
        kind: "other",
        url: "https://example.com/asset",
        usageMethod: "other",
        isPrimary: true,
      },
    ],
    related_links: [],
  } as unknown as ProjectRow;

  const game = projectRowToGame(row);
  assert.equal(game.category, "asset");
  assert.deepEqual(game.categoryAttributes, {});
  const form = buildProjectEditFormDataFromGame(game);
  assert.equal(form.category, "asset");
  assert.deepEqual(form.categoryAttributes ?? {}, {});
}

// edit update via publication planner (common path used by asset overview)
async function main() {
  // insertProject → mock .insert
  {
    const draft = assetDraft();
    const form = planStudioSubmitWrite({
      draft,
      owner,
      projectCategory: "asset",
    });
    let insertPayload: Record<string, unknown> | null = null;
    const supabase = {
      from(table: string) {
        assert.equal(table, "projects");
        return {
          insert(payload: Record<string, unknown>) {
            insertPayload = JSON.parse(JSON.stringify(payload));
            return {
              select() {
                return {
                  single: async () => ({
                    data: {
                      id: PROJECT_ID,
                      owner_id: OWNER_ID,
                      owner_name: "Tester",
                      title: payload.title,
                      creator: "Tester",
                      genre: payload.genre ?? "",
                      genres: payload.genres ?? [],
                      description: payload.description,
                      overview_introduction: payload.overview_introduction,
                      overview_features: null,
                      phase: payload.phase,
                      status: payload.phase,
                      looking_for_testers: false,
                      tester_slots: null,
                      section: "new",
                      thumbnail_url: null,
                      thumbnail_urls: [],
                      tags: payload.tags ?? [],
                      play_url: payload.play_url ?? "",
                      steam_url: null,
                      itch_url: null,
                      github_url: null,
                      discord_url: null,
                      official_url: null,
                      x_url: null,
                      youtube_url: null,
                      visibility: payload.visibility ?? "public",
                      created_at: "2026-08-01T00:00:00Z",
                      updated_at: "2026-08-02T00:00:00Z",
                      category: payload.category,
                      category_attributes: payload.category_attributes ?? {},
                      asset_kinds: [],
                      playable_version: "1.0.0",
                      release_status: "in_development",
                      play_access_type: payload.play_access_type ?? "free",
                      age_rating: "general",
                      publish_destinations: payload.publish_destinations ?? [],
                      related_links: [],
                    },
                    error: null,
                  }),
                };
              },
            };
          },
        };
      },
    };
    const game = await insertProject(
      supabase as unknown as SupabaseClient,
      form,
      owner,
    );
    assert.ok(insertPayload);
    const captured = insertPayload as Record<string, unknown>;
    assert.equal(captured.category, "asset");
    assert.deepEqual(captured.category_attributes, {});
    assert.ok(!("asset_kinds" in captured));
    assert.equal(captured.play_url, "https://example.com/asset");
    assert.ok(Array.isArray(captured.publish_destinations));
    assert.ok(Array.isArray(captured.tags));
    assert.equal(game.category, "asset");
    assert.deepEqual(game.categoryAttributes, {});
  }

  const { supabase, state } = createProjectsSupabaseMock();
  const game = assetGame();
  const form = buildGamePublicationEditPersistPayload(game, {
    visibility: "private",
    publishDestinations: [
      createEmptyPublishDestination({
        id: "pub-2",
        kind: "other",
        url: "https://example.com/asset-v2",
        usageMethod: "other",
        isPrimary: true,
      }),
    ],
    relatedLinks: [],
  });
  // no manual category correction — planner must keep asset from hydration
  assert.equal(form.category, "asset");
  assert.deepEqual(form.categoryAttributes ?? {}, {});
  await updateProjectDetailsInDb(supabase, game.id, form);
  assert.equal(state.updateCalls, 1);
  const payload = state.updatePayloads[0];
  assert.equal(payload.category, "asset");
  assert.deepEqual(payload.category_attributes, {});
  assert.equal(payload.visibility, "private");
  assert.equal(payload.play_url, "https://example.com/asset-v2");
  assert.ok(
    (payload.tags as string[]).includes("古いレガシータグ"),
    "legacy tags preserved",
  );
  assert.ok(!("asset_kinds" in payload));
  assert.ok(!JSON.stringify(payload).includes("musicDuration"));

  // Search must not revive asset_kind UI
  {
    const search = read("components/player-ia/player-ia-search-page.tsx");
    assert.doesNotMatch(
      search,
      /asset_kind[^_].*checkbox|AssetKindFilter|assetKinds\.map/,
    );
  }

  const overviewSrc = read("components/studio-tab-context-panel.tsx");
  assert.match(overviewSrc, /isStudioCommonFieldsOnlyCategory/);
  assert.match(overviewSrc, /このカテゴリではジャンル編集はありません/);

  console.log("studio-asset-common-fields ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
