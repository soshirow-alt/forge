/**
 * Panel section-save → persist via shared attemptNonGameSectionSave
 * (same controller as studio-submit-edit-panels.tsx).
 *
 * Production overview sequence mirrored here:
 *   panel gate (attemptNonGameSectionSave)
 *   → onApply (draft apply + createNonGameEditSaveSession.requestSave)
 *   → updateProjectDetailsInDb → Supabase mock
 *
 * Invalid: validationError set from engine message; onApply never runs; updateCalls=0
 * Valid: onApply runs persist; updateCalls=1
 */
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createEmptySubmitPrototypeCategoryFields,
  type SubmitPrototypeCategory,
  type SubmitPrototypeCategoryFields,
} from "../lib/prototype/studio-submit-flow";
import { attemptNonGameSectionSave } from "../lib/studio-non-game-section-save";
import { createNonGameEditSaveSession } from "../lib/studio-non-game-edit-save-session";
import { updateProjectDetailsInDb } from "../lib/supabase/projects";
import { createEmptySubmitDraft } from "../lib/studio-submit-draft";
import { EMPTY_PLAY_ENVIRONMENT_FORM } from "../lib/play-environment";
import type { Game } from "../lib/mock-games";
import type { NonGameSectionId } from "../lib/studio-non-game-section-save";

const PROJECT_ID = "33333333-3333-4333-8333-333333333333";
const OWNER_ID = "11111111-1111-4111-8111-111111111111";

function createProjectsSupabaseMock(): {
  supabase: SupabaseClient;
  updateCalls: number;
} {
  let updateCalls = 0;
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
          void payload;
          updateCalls += 1;
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
                        title: "Title",
                        creator: "Tester",
                        genre: "",
                        genres: [],
                        description: "desc",
                        overview_introduction: null,
                        phase: "playable",
                        status: "playable",
                        looking_for_testers: false,
                        tester_slots: null,
                        section: "new",
                        thumbnail_url: null,
                        tags: [],
                        play_url: "",
                        steam_url: null,
                        itch_url: null,
                        github_url: null,
                        discord_url: null,
                        official_url: null,
                        visibility: "public",
                        created_at: "2026-08-01T00:00:00Z",
                        updated_at: "2026-08-02T00:00:00Z",
                        category: "audio",
                        category_attributes: {},
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
  return {
    supabase: supabase as unknown as SupabaseClient,
    get updateCalls() {
      return updateCalls;
    },
  };
}

function baseGame(overrides: Partial<Game> = {}): Game {
  return {
    id: PROJECT_ID,
    title: "Title",
    creator: "Tester",
    genres: [],
    genre: "",
    description: "desc",
    overviewIntroduction: "intro",
    overviewFeatures: null,
    phase: "playable",
    status: "playable",
    lookingForTesters: false,
    lastUpdated: "2026-08-01",
    createdAt: "2026-08-01T00:00:00Z",
    section: "new",
    thumbnailUrls: [],
    tags: [],
    playUrl: "https://example.com",
    ownerId: OWNER_ID,
    ownerName: "Tester",
    visibility: "public",
    playableVersion: "1.0.0",
    releaseStatus: "in_development",
    playAccessType: "free",
    ageRating: "general",
    category: "audio",
    categoryAttributes: {},
    ...overrides,
  };
}

function emptyDraft() {
  return {
    ...createEmptySubmitDraft(),
    featureTags: ["癒し系" as const],
    visibility: "public" as const,
  };
}

/**
 * Same sequence as overview non-game panels:
 * attemptNonGameSectionSave → onApply → session.requestSave → DB update.
 * Panels set validationError from result.message when applied=false.
 */
async function runPanelSectionSaveToDb(input: {
  category: SubmitPrototypeCategory;
  section: NonGameSectionId;
  fields: SubmitPrototypeCategoryFields;
  projectCategory: Game["category"];
}): Promise<{
  validationError: string | null;
  applied: boolean;
  updateCalls: number;
  closed: boolean;
}> {
  const mock = createProjectsSupabaseMock();
  const game = baseGame({
    category: input.projectCategory,
    categoryAttributes: {},
  });
  const draft = emptyDraft();
  const session = createNonGameEditSaveSession({
    game,
    prototypeCategory: input.category,
    playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
    editMode: input.section,
    update: async (payload) => {
      await updateProjectDetailsInDb(mock.supabase, game.id, payload);
    },
  });

  let appliedPatch: SubmitPrototypeCategoryFields | null = null;
  let closed = false;

  const result = await attemptNonGameSectionSave({
    category: input.category,
    section: input.section,
    fields: input.fields,
    onApply: async () => {
      // Panel onFieldsChange / onChange equivalent
      appliedPatch = input.fields;
      const outcome = await session.requestSave(appliedPatch, draft);
      closed = outcome.closed;
    },
  });

  // Panel: setValidationError(result.message) when !applied
  const validationError = result.applied ? null : result.message;

  return {
    validationError,
    applied: result.applied,
    updateCalls: mock.updateCalls,
    closed,
  };
}

const validAudioPublish = [
  {
    id: "a1",
    kind: "YouTube",
    url: "https://youtube.com/watch?v=audio",
    isPrimary: true,
  },
];

async function main() {
  // 1. audio invalid duration → engine message shown; no persist
  {
    const out = await runPanelSectionSaveToDb({
      category: "music",
      section: "play-info",
      projectCategory: "audio",
      fields: {
        ...createEmptySubmitPrototypeCategoryFields(),
        kind: "楽曲",
        musicDuration: "0:00",
      },
    });
    assert.equal(out.applied, false);
    assert.equal(out.updateCalls, 0);
    assert.equal(out.closed, false);
    assert.ok(out.validationError?.includes("再生時間"));
  }

  // 2. valid audio → panel apply → persist → update 1
  {
    const fields: SubmitPrototypeCategoryFields = {
      ...createEmptySubmitPrototypeCategoryFields(),
      kind: "楽曲",
      musicGenres: ["ポップ"],
      musicDuration: "2:10",
      publishDestinations: validAudioPublish,
    };
    const out = await runPanelSectionSaveToDb({
      category: "music",
      section: "play-info",
      projectCategory: "audio",
      fields,
    });
    assert.equal(out.validationError, null);
    assert.equal(out.applied, true);
    assert.equal(out.updateCalls, 1);
    assert.equal(out.closed, true);
  }

  // 3. publish URL without kind → engine message; no persist
  {
    const out = await runPanelSectionSaveToDb({
      category: "music",
      section: "publication",
      projectCategory: "audio",
      fields: {
        ...createEmptySubmitPrototypeCategoryFields(),
        kind: "楽曲",
        publishDestinations: [
          {
            id: "a1",
            kind: "",
            url: "https://youtube.com/watch?v=x",
            isPrimary: true,
          },
        ],
      },
    });
    assert.equal(out.applied, false);
    assert.equal(out.updateCalls, 0);
    assert.ok(out.validationError?.includes("公開先"));
  }

  // 4. out-of-category kind → no persist
  {
    const out = await runPanelSectionSaveToDb({
      category: "music",
      section: "publication",
      projectCategory: "audio",
      fields: {
        ...createEmptySubmitPrototypeCategoryFields(),
        kind: "楽曲",
        publishDestinations: [
          {
            id: "a1",
            kind: "npm",
            url: "https://www.npmjs.com/package/x",
            isPrimary: true,
          },
        ],
      },
    });
    assert.equal(out.applied, false);
    assert.equal(out.updateCalls, 0);
    assert.ok(out.validationError);
  }

  // 5. dev-tool toolUsageMethod missing → engine message; no persist
  {
    const out = await runPanelSectionSaveToDb({
      category: "dev_tool",
      section: "play-info",
      projectCategory: "dev-tool",
      fields: {
        ...createEmptySubmitPrototypeCategoryFields(),
        kind: "デスクトップツール",
        toolUsageMethod: "",
        toolEnvironments: ["Windows"],
      },
    });
    assert.equal(out.applied, false);
    assert.equal(out.updateCalls, 0);
    assert.ok(out.validationError?.includes("利用方法"));
  }

  // 6. valid dev-tool → persist
  {
    const fields: SubmitPrototypeCategoryFields = {
      ...createEmptySubmitPrototypeCategoryFields(),
      kind: "デスクトップツール",
      toolUsageMethod: "ダウンロードして利用",
      toolEnvironments: ["Windows"],
      publishDestinations: [
        {
          id: "t1",
          kind: "BOOTH",
          url: "https://booth.pm/demo",
          isPrimary: true,
        },
      ],
    };
    const out = await runPanelSectionSaveToDb({
      category: "dev_tool",
      section: "play-info",
      projectCategory: "dev-tool",
      fields,
    });
    assert.equal(out.validationError, null);
    assert.equal(out.applied, true);
    assert.equal(out.updateCalls, 1);
    assert.equal(out.closed, true);
  }

  // 7. valid service-app → persist
  {
    const fields: SubmitPrototypeCategoryFields = {
      ...createEmptySubmitPrototypeCategoryFields(),
      kind: "Webサービス",
      serviceEnvironments: ["Webブラウザ"],
      publishDestinations: [
        {
          id: "s1",
          kind: "自サイト",
          url: "https://example.com/app",
          isPrimary: true,
        },
      ],
    };
    const out = await runPanelSectionSaveToDb({
      category: "web_service",
      section: "play-info",
      projectCategory: "service-app",
      fields,
    });
    assert.equal(out.validationError, null);
    assert.equal(out.applied, true);
    assert.equal(out.updateCalls, 1);
    assert.equal(out.closed, true);
  }

  console.log("studio-panel-section-validation ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
