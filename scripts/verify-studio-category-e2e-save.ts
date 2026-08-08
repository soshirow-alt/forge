/**
 * End-to-end non-game edit save:
 * save session → buildNonGameEditPersistPayload → updateProjectDetailsInDb → Supabase mock .update
 *
 * Expected objects are hand-written literals (not generated from encode/map helpers).
 * Usage: npx tsx scripts/verify-studio-category-e2e-save.ts
 */
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createEmptySubmitDraft } from "../lib/studio-submit-draft";
import {
  createEmptySubmitPrototypeCategoryFields,
  type SubmitPrototypeCategory,
  type SubmitPrototypeCategoryFields,
} from "../lib/prototype/studio-submit-flow";
import { createNonGameEditSaveSession } from "../lib/studio-non-game-edit-save-session";
import { updateProjectDetailsInDb } from "../lib/supabase/projects";
import { buildProjectEditFormDataFromGame } from "../lib/project-edit-form-data";
import { EMPTY_PLAY_ENVIRONMENT_FORM } from "../lib/play-environment";
import type { Game } from "../lib/mock-games";
import { mapPrototypePublishToFormal } from "../lib/studio-non-game-attributes";

const PROJECT_ID = "33333333-3333-4333-8333-333333333333";
const OWNER_ID = "11111111-1111-4111-8111-111111111111";

type MockState = {
  updatePayloads: Record<string, unknown>[];
  updateCalls: number;
};

function createProjectsSupabaseMock(options: {
  failUpdate?: boolean;
} = {}): { supabase: SupabaseClient; state: MockState } {
  const state: MockState = { updatePayloads: [], updateCalls: 0 };

  const supabase = {
    from(table: string) {
      assert.equal(table, "projects");
      return {
        select(_cols: string) {
          void _cols;
          return {
            eq(_col: string, _id: string) {
              void _col;
              void _id;
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
            eq(_col: string, _id: string) {
              void _col;
              void _id;
              return {
                select(_cols: string) {
                  void _cols;
                  return {
                    single: async () => {
                      if (options.failUpdate) {
                        return {
                          data: null,
                          error: {
                            message: "simulated update failure",
                            details: "",
                            hint: "",
                            code: "PGRST",
                            name: "PostgrestError",
                            toJSON() {
                              return this;
                            },
                          },
                        };
                      }
                      return {
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
                          category: String(payload.category ?? "game"),
                          category_attributes: payload.category_attributes ?? {},
                          playable_version: "1.0.0",
                          release_status: "in_development",
                          play_access_type: "free",
                          age_rating: "general",
                        },
                        error: null,
                      };
                    },
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
    category: "game",
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

const audioFields: SubmitPrototypeCategoryFields = {
  ...createEmptySubmitPrototypeCategoryFields(),
  kind: "楽曲",
  musicGenres: ["ポップ"],
  musicDuration: "2:10",
  publishDestinations: [
    {
      id: "a1",
      kind: "YouTube",
      url: "https://youtube.com/watch?v=audio",
      isPrimary: true,
    },
  ],
};

const toolFields: SubmitPrototypeCategoryFields = {
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

const serviceFields: SubmitPrototypeCategoryFields = {
  ...createEmptySubmitPrototypeCategoryFields(),
  kind: "Webサービス",
  serviceEnvironments: ["Webブラウザ"],
  publishDestinations: [
    {
      id: "s1",
      kind: "Webサービス",
      url: "https://example.com/app",
      isPrimary: true,
    },
  ],
};

/** Hand-written expected DB update payloads (publication mode). */
const EXPECTED_AUDIO_UPDATE: Record<string, unknown> = {
  title: "Title",
  description: "desc",
  genre: "",
  genres: [],
  phase: "playable",
  status: "playable",
  looking_for_testers: false,
  tester_slots: null,
  tags: ["癒し系"],
  estimated_play_time: null,
  play_url: "https://youtube.com/watch?v=audio",
  steam_url: null,
  itch_url: null,
  github_url: null,
  discord_url: null,
  official_url: null,
  x_url: null,
  youtube_url: null,
  publish_destinations: [
    {
      id: "a1",
      kind: "other",
      url: "https://youtube.com/watch?v=audio",
      usageMethod: "other",
      isPrimary: true,
    },
  ],
  related_links: [],
  visibility: "public",
  play_access_type: "free",
  age_rating: "general",
  category: "audio",
  category_attributes: {
    keepMe: true,
    kind: "楽曲",
    musicGenres: ["ポップ"],
    musicDuration: "2:10",
    nonGamePublishDestinations: [
      {
        id: "a1",
        kind: "YouTube",
        url: "https://youtube.com/watch?v=audio",
        isPrimary: true,
      },
    ],
  },
  thumbnail_url: null,
  thumbnail_urls: [],
  og_image_url: null,
};

const EXPECTED_TOOL_UPDATE: Record<string, unknown> = {
  ...EXPECTED_AUDIO_UPDATE,
  play_url: "https://booth.pm/demo",
  publish_destinations: [
    {
      id: "t1",
      kind: "booth",
      url: "https://booth.pm/demo",
      usageMethod: null,
      isPrimary: true,
    },
  ],
  category: "dev-tool",
  category_attributes: {
    keepMe: true,
    kind: "デスクトップツール",
    toolEnvironments: ["Windows"],
    toolUsageMethod: "ダウンロードして利用",
    nonGamePublishDestinations: [
      {
        id: "t1",
        kind: "BOOTH",
        url: "https://booth.pm/demo",
        isPrimary: true,
      },
    ],
  },
};

const EXPECTED_SERVICE_UPDATE: Record<string, unknown> = {
  ...EXPECTED_AUDIO_UPDATE,
  play_url: "https://example.com/app",
  publish_destinations: [
    {
      id: "s1",
      kind: "other",
      url: "https://example.com/app",
      usageMethod: "other",
      isPrimary: true,
    },
  ],
  category: "service-app",
  category_attributes: {
    keepMe: true,
    kind: "Webサービス",
    serviceEnvironments: ["Webブラウザ"],
    nonGamePublishDestinations: [
      {
        id: "s1",
        kind: "Webサービス",
        url: "https://example.com/app",
        isPrimary: true,
      },
    ],
  },
};

function assertNoCrossCategoryAttrs(
  attrs: Record<string, unknown>,
  forbidden: string[],
) {
  for (const key of forbidden) {
    assert.ok(!(key in attrs), `unexpected attribute ${key}`);
  }
}

async function runPublicationE2E(input: {
  category: "audio" | "dev-tool" | "service-app";
  proto: SubmitPrototypeCategory;
  fields: SubmitPrototypeCategoryFields;
  expected: Record<string, unknown>;
  forbiddenAttrs: string[];
}) {
  const { supabase, state } = createProjectsSupabaseMock();
  let onSavedCalls = 0;
  const game = baseGame({
    category: input.category,
    categoryAttributes: { keepMe: true },
  });
  const session = createNonGameEditSaveSession({
    game,
    prototypeCategory: input.proto,
    playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
    editMode: "publication",
    update: async (payload) => {
      await updateProjectDetailsInDb(supabase, game.id, payload);
    },
    onSaved: () => {
      onSavedCalls += 1;
    },
  });

  const pendingStarted = session.requestSave(input.fields, emptyDraft());
  const dup = await session.requestSave(input.fields, emptyDraft());
  assert.equal(dup.duplicateIgnored, true);
  assert.equal(dup.closed, false);
  assert.equal(dup.onSavedCalled, false);
  assert.equal(state.updateCalls, 0);

  const outcome = await pendingStarted;
  assert.equal(outcome.closed, true);
  assert.equal(outcome.onSavedCalled, true);
  assert.equal(outcome.updateCalled, true);
  assert.equal(onSavedCalls, 1);
  assert.equal(state.updateCalls, 1);
  assert.deepEqual(state.updatePayloads[0], input.expected);
  assertNoCrossCategoryAttrs(
    state.updatePayloads[0].category_attributes as Record<string, unknown>,
    input.forbiddenAttrs,
  );
}

async function main() {
  await runPublicationE2E({
    category: "audio",
    proto: "music",
    fields: audioFields,
    expected: EXPECTED_AUDIO_UPDATE,
    forbiddenAttrs: [
      "toolEnvironments",
      "toolUsageMethod",
      "serviceEnvironments",
    ],
  });

  await runPublicationE2E({
    category: "dev-tool",
    proto: "dev_tool",
    fields: toolFields,
    expected: EXPECTED_TOOL_UPDATE,
    forbiddenAttrs: ["musicGenres", "musicDuration", "serviceEnvironments"],
  });

  await runPublicationE2E({
    category: "service-app",
    proto: "web_service",
    fields: serviceFields,
    expected: EXPECTED_SERVICE_UPDATE,
    forbiddenAttrs: [
      "musicGenres",
      "musicDuration",
      "toolEnvironments",
      "toolUsageMethod",
    ],
  });

  // publish destination negative cases — never reach DB
  {
    const { supabase, state } = createProjectsSupabaseMock();
    const game = baseGame({ category: "audio", categoryAttributes: {} });
    let onSaved = 0;
    const session = createNonGameEditSaveSession({
      game,
      prototypeCategory: "music",
      playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
      editMode: "publication",
      update: async (payload) => {
      await updateProjectDetailsInDb(supabase, game.id, payload);
    },
      onSaved: () => {
        onSaved += 1;
      },
    });

    const emptyKind = await session.requestSave(
      {
        ...createEmptySubmitPrototypeCategoryFields(),
        kind: "楽曲",
        publishDestinations: [
          {
            id: "x",
            kind: "",
            url: "https://example.com",
            isPrimary: true,
          },
        ],
      },
      emptyDraft(),
    );
    assert.equal(emptyKind.closed, false);
    assert.equal(emptyKind.onSavedCalled, false);
    assert.equal(emptyKind.updateCalled, false);
    assert.equal(state.updateCalls, 0);
    assert.equal(onSaved, 0);

    const unknownKind = await session.requestSave(
      {
        ...createEmptySubmitPrototypeCategoryFields(),
        kind: "楽曲",
        publishDestinations: [
          {
            id: "x",
            kind: "unknown-kind",
            url: "https://example.com",
            isPrimary: true,
          },
        ],
      },
      emptyDraft(),
    );
    assert.equal(unknownKind.closed, false);
    assert.equal(state.updateCalls, 0);

    const crossCategory = await session.requestSave(
      {
        ...createEmptySubmitPrototypeCategoryFields(),
        kind: "楽曲",
        publishDestinations: [
          {
            id: "x",
            kind: "ブラウザ版",
            url: "https://example.com",
            isPrimary: true,
          },
        ],
      },
      emptyDraft(),
    );
    assert.equal(crossCategory.closed, false);
    assert.equal(state.updateCalls, 0);

    // valid kind reaches formal other for YouTube — no silent empty→other
    assert.throws(() =>
      mapPrototypePublishToFormal([
        {
          id: "1",
          kind: "",
          url: "https://example.com",
          isPrimary: true,
        },
      ]),
    );
  }

  // DB error: update called, onSaved/close not
  {
    const { supabase, state } = createProjectsSupabaseMock({ failUpdate: true });
    let onSaved = 0;
    const game = baseGame({
      category: "audio",
      categoryAttributes: { keepMe: true },
    });
    const session = createNonGameEditSaveSession({
      game,
      prototypeCategory: "music",
      playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
      editMode: "publication",
      update: async (payload) => {
      await updateProjectDetailsInDb(supabase, game.id, payload);
    },
      onSaved: () => {
        onSaved += 1;
      },
    });
    const failed = await session.requestSave(audioFields, emptyDraft());
    assert.equal(failed.closed, false);
    assert.equal(failed.onSavedCalled, false);
    assert.equal(failed.updateCalled, true);
    assert.equal(state.updateCalls, 1);
    assert.equal(onSaved, 0);
    assert.ok(failed.saveError);
  }

  // game regression — does not use non-game save session; payload has no non-game attrs
  {
    const { supabase, state } = createProjectsSupabaseMock();
    const game = baseGame({ category: "game", genres: ["RPG"] });
    const form = buildProjectEditFormDataFromGame(game);
    await updateProjectDetailsInDb(supabase, game.id, form);
    assert.equal(state.updateCalls, 1);
    const payload = state.updatePayloads[0];
    assert.equal(payload.category, "game");
    const attrs =
      (payload.category_attributes as Record<string, unknown> | undefined) ??
      {};
    for (const key of [
      "kind",
      "musicGenres",
      "musicDuration",
      "toolEnvironments",
      "toolUsageMethod",
      "serviceEnvironments",
      "nonGamePublishDestinations",
    ]) {
      assert.ok(!(key in attrs), `game regression leaked ${key}`);
    }
    assert.ok(Array.isArray(payload.genres));
    assert.ok((payload.genres as string[]).includes("RPG"));
  }

  console.log("studio-category-e2e-save ok");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
