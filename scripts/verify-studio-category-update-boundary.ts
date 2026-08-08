/**
 * updateProjectDetailsInDb Supabase-mock boundary + non-game edit save session.
 * Usage: npx tsx scripts/verify-studio-category-update-boundary.ts
 */
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createEmptySubmitDraft,
} from "../lib/studio-submit-draft";
import {
  createEmptySubmitPrototypeCategoryFields,
  type SubmitPrototypeCategoryFields,
} from "../lib/prototype/studio-submit-flow";
import {
  encodePrototypeFieldsToCategoryAttributes,
  mapPrototypePublishToFormal,
  validatePrototypePublishDestinationsForCategory,
} from "../lib/studio-non-game-attributes";
import {
  updateProjectDetailsInDb,
} from "../lib/supabase/projects";
import { buildProjectEditFormDataFromGame } from "../lib/project-edit-form-data";
import type { ProjectEditFormData } from "../lib/project-form";
import { createNonGameEditSaveSession } from "../lib/studio-non-game-edit-save-session";
import { EMPTY_PLAY_ENVIRONMENT_FORM } from "../lib/play-environment";
import { validateNonGamePrototypeFieldsForSave } from "../hooks/use-studio-submit";
import type { Game } from "../lib/mock-games";
import { getPrimaryPublishDestination } from "../lib/project-publish-links";

type MockOptions = {
  failUpdate?: boolean;
};

function createProjectsSupabaseMock(options: MockOptions = {}) {
  const updatePayloads: Record<string, unknown>[] = [];
  let selectThumbCalls = 0;
  let updateCalls = 0;

  const baseReturned = {
    id: "33333333-3333-4333-8333-333333333333",
    owner_id: "11111111-1111-4111-8111-111111111111",
    owner_name: "Tester",
    title: "Title",
    creator: "Tester",
    genre: "",
    genres: [] as string[],
    description: "desc",
    overview_introduction: "intro",
    phase: "playable",
    status: "playable",
    looking_for_testers: false,
    tester_slots: null,
    section: "new",
    thumbnail_url: null,
    thumbnail_urls: [] as string[],
    tags: [] as string[],
    play_url: "https://example.com",
    steam_url: null,
    itch_url: null,
    github_url: null,
    discord_url: null,
    official_url: null,
    x_url: null,
    youtube_url: null,
    publish_destinations: null,
    related_links: null,
    visibility: "public",
    playable_version: "1.0.0",
    release_status: "in_development",
    play_access_type: "free",
    estimated_play_time: null,
    age_rating: "general",
    category: "game",
    category_attributes: {},
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
  };

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
                maybeSingle: async () => {
                  selectThumbCalls += 1;
                  return {
                    data: { thumbnail_url: null, thumbnail_urls: [] },
                    error: null,
                  };
                },
              };
            },
          };
        },
        update(payload: Record<string, unknown>) {
          updateCalls += 1;
          updatePayloads.push({ ...payload });
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
                          ...baseReturned,
                          ...payload,
                          updated_at: "2026-08-02T00:00:00Z",
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

  return {
    supabase: supabase as unknown as SupabaseClient,
    updatePayloads,
    getUpdateCalls: () => updateCalls,
    getSelectThumbCalls: () => selectThumbCalls,
  };
}

function baseGame(overrides: Partial<Game> = {}): Game {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    title: "Title",
    creator: "Tester",
    genres: ["RPG"],
    genre: "RPG",
    description: "desc",
    overviewIntroduction: "intro",
    overviewFeatures: null,
    phase: "playable",
    status: "playable",
    lookingForTesters: false,
    lastUpdated: "2026-08-01",
    createdAt: "2026-08-01T00:00:00Z",
    section: "new",
    thumbnailUrl: undefined,
    thumbnailUrls: [],
    tags: [],
    playUrl: "https://example.com",
    ownerId: "11111111-1111-4111-8111-111111111111",
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

async function assertCategoryUpdate(
  category: "audio" | "dev-tool" | "service-app",
  fields: SubmitPrototypeCategoryFields,
  expectedAttrsLiteral: Record<string, unknown>,
  forbiddenAttrKeys: string[],
) {
  const mock = createProjectsSupabaseMock();
  const game = baseGame({
    category,
    categoryAttributes: { keepMe: true },
    genres: [],
    tags: ["癒し系"],
  });
  const form: ProjectEditFormData = {
    ...buildProjectEditFormDataFromGame(game),
    category,
    categoryAttributes: expectedAttrsLiteral,
    tags: ["癒し系"],
    publishDestinations: mapPrototypePublishToFormal(fields.publishDestinations),
  };

  const updated = await updateProjectDetailsInDb(
    mock.supabase,
    game.id,
    form,
  );
  assert.equal(mock.getUpdateCalls(), 1);
  const payload = mock.updatePayloads[0];
  assert.equal(payload.category, category);
  assert.deepEqual(payload.category_attributes, expectedAttrsLiteral);
  assert.deepEqual(payload.tags, ["癒し系"]);
  assert.deepEqual(
    payload.publish_destinations,
    form.publishDestinations,
  );
  const primary = getPrimaryPublishDestination(form.publishDestinations ?? []);
  assert.ok(primary);
  assert.equal(payload.play_url, primary.url);
  assert.equal(payload.steam_url ?? null, null);
  assert.equal(payload.itch_url ?? null, null);
  assert.equal(updated.category, category);
  for (const key of forbiddenAttrKeys) {
    assert.ok(
      !(key in (payload.category_attributes as Record<string, unknown>)),
      `forbidden ${key}`,
    );
  }
}

async function main() {
const audioExpectedAttrs = {
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
};
const toolExpectedAttrs = {
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
};
const serviceExpectedAttrs = {
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
};

await assertCategoryUpdate("audio", audioFields, audioExpectedAttrs, [
  "toolUsageMethod",
  "serviceEnvironments",
]);
await assertCategoryUpdate("dev-tool", toolFields, toolExpectedAttrs, [
  "musicGenres",
  "musicDuration",
  "serviceEnvironments",
]);
await assertCategoryUpdate("service-app", serviceFields, serviceExpectedAttrs, [
  "musicGenres",
  "toolUsageMethod",
]);

// game regression — no non-game attrs forced
{
  const mock = createProjectsSupabaseMock();
  const game = baseGame();
  const form = buildProjectEditFormDataFromGame(game);
  assert.equal(form.category, "game");
  const beforeKeys = Object.keys(form).sort();
  await updateProjectDetailsInDb(mock.supabase, game.id, form);
  assert.equal(mock.getUpdateCalls(), 1);
  const payload = mock.updatePayloads[0];
  assert.equal(payload.category, "game");
  const attrs = (payload.category_attributes as Record<string, unknown> | undefined) ?? {};
  for (const key of [
    "kind",
    "musicGenres",
    "musicDuration",
    "toolEnvironments",
    "toolUsageMethod",
    "serviceEnvironments",
    "nonGamePublishDestinations",
  ]) {
    assert.ok(!(key in attrs), `game must not get ${key}`);
  }
  assert.ok(typeof payload.title === "string");
  assert.deepEqual(Object.keys(form).sort(), beforeKeys);
}

// DB error propagates
{
  const mock = createProjectsSupabaseMock({ failUpdate: true });
  const game = baseGame({ category: "audio", genres: [] });
  const form: ProjectEditFormData = {
    ...buildProjectEditFormDataFromGame(game),
    category: "audio",
    categoryAttributes: encodePrototypeFieldsToCategoryAttributes(audioFields),
    publishDestinations: mapPrototypePublishToFormal(
      audioFields.publishDestinations,
    ),
  };
  await assert.rejects(() =>
    updateProjectDetailsInDb(mock.supabase, game.id, form),
  );
  assert.equal(mock.getUpdateCalls(), 1);
}

// validation failure → update not called (via save session)
{
  let updateCalls = 0;
  let onSavedCalls = 0;
  const session = createNonGameEditSaveSession({
    game: baseGame({ category: "audio", genres: [] }),
    prototypeCategory: "music",
    playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
    editMode: "publication",
    update: async () => {
      updateCalls += 1;
    },
    onSaved: () => {
      onSavedCalls += 1;
    },
  });
  const invalidFields = {
    ...audioFields,
    publishDestinations: [
      { id: "x", kind: "", url: "https://example.com", isPrimary: true },
    ],
  };
  assert.equal(
    validateNonGamePrototypeFieldsForSave("music", invalidFields).ok,
    false,
  );
  const outcome = await session.requestSave(invalidFields, {
    ...createEmptySubmitDraft(),
    featureTags: [],
    visibility: "public",
  });
  assert.equal(outcome.closed, false);
  assert.equal(outcome.onSavedCalled, false);
  assert.equal(outcome.updateCalled, false);
  assert.equal(updateCalls, 0);
  assert.equal(onSavedCalls, 0);
  assert.ok(outcome.saveError);
}

// success → onSaved; failure throw → no onSaved; pending duplicate ignored
{
  let updateCalls = 0;
  let onSavedCalls = 0;
  let releaseUpdate: (() => void) | undefined;
  const session = createNonGameEditSaveSession({
    game: baseGame({
      category: "audio",
      genres: [],
      categoryAttributes: {},
    }),
    prototypeCategory: "music",
    playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
    editMode: "publication",
    update: () =>
      new Promise<void>((resolve) => {
        updateCalls += 1;
        releaseUpdate = resolve;
      }),
    onSaved: () => {
      onSavedCalls += 1;
    },
  });

  const draft = {
    ...createEmptySubmitDraft(),
    featureTags: ["癒し系" as const],
    visibility: "public" as const,
  };

  const pending = session.requestSave(audioFields, draft);
  // while pending, duplicate ignored
  const dup = await session.requestSave(audioFields, draft);
  assert.equal(dup.duplicateIgnored, true);
  assert.equal(dup.closed, false);
  assert.equal(dup.onSavedCalled, false);

  releaseUpdate?.();
  const ok = await pending;
  assert.equal(ok.closed, true);
  assert.equal(ok.onSavedCalled, true);
  assert.equal(ok.updateCalled, true);
  assert.equal(updateCalls, 1);
  assert.equal(onSavedCalls, 1);

  // throw path
  const failSession = createNonGameEditSaveSession({
    game: baseGame({ category: "dev-tool", genres: [] }),
    prototypeCategory: "dev_tool",
    playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
    editMode: "publication",
    update: async () => {
      throw new Error("db down");
    },
    onSaved: () => {
      onSavedCalls += 1;
    },
  });
  const beforeSaved = onSavedCalls;
  const failed = await failSession.requestSave(toolFields, draft);
  assert.equal(failed.closed, false);
  assert.equal(failed.onSavedCalled, false);
  assert.equal(failed.updateCalled, true);
  assert.equal(onSavedCalls, beforeSaved);
  assert.ok(failed.saveError);

  // service-app success
  const serviceSession = createNonGameEditSaveSession({
    game: baseGame({ category: "service-app", genres: [] }),
    prototypeCategory: "web_service",
    playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
    editMode: "publication",
    update: async () => {},
    onSaved: () => {
      onSavedCalls += 1;
    },
  });
  const serviceOk = await serviceSession.requestSave(serviceFields, draft);
  assert.equal(serviceOk.closed, true);
  assert.equal(serviceOk.onSavedCalled, true);
}

// empty category_attributes: each panel can save independently (3 categories × modes)
{
  const cases = [
    {
      category: "audio" as const,
      proto: "music" as const,
      fields: audioFields,
      playFields: {
        ...createEmptySubmitPrototypeCategoryFields(),
        musicDuration: "1:00",
      },
    },
    {
      category: "dev-tool" as const,
      proto: "dev_tool" as const,
      fields: toolFields,
      playFields: {
        ...createEmptySubmitPrototypeCategoryFields(),
        toolUsageMethod: "ダウンロードして利用",
        toolEnvironments: ["Windows"],
      },
    },
    {
      category: "service-app" as const,
      proto: "web_service" as const,
      fields: serviceFields,
      playFields: {
        ...createEmptySubmitPrototypeCategoryFields(),
        serviceEnvironments: ["Webブラウザ"],
      },
    },
  ];

  for (const item of cases) {
    const emptyGame = baseGame({
      category: item.category,
      genres: [],
      categoryAttributes: {},
    });
    const draft = {
      ...createEmptySubmitDraft(),
      featureTags: [],
      visibility: "public" as const,
    };

    // genres-tags: kind only
    {
      let updates = 0;
      let onSaved = 0;
      const session = createNonGameEditSaveSession({
        game: emptyGame,
        prototypeCategory: item.proto,
        playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
        editMode: "genres-tags",
        update: async () => {
          updates += 1;
        },
        onSaved: () => {
          onSaved += 1;
        },
      });
      const outcome = await session.requestSave(
        { ...createEmptySubmitPrototypeCategoryFields(), kind: item.fields.kind },
        draft,
      );
      assert.equal(outcome.closed, true);
      assert.equal(outcome.onSavedCalled, true);
      assert.equal(updates, 1);
      assert.equal(onSaved, 1);
    }

    // play-info
    {
      let updates = 0;
      const session = createNonGameEditSaveSession({
        game: emptyGame,
        prototypeCategory: item.proto,
        playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
        editMode: "play-info",
        update: async () => {
          updates += 1;
        },
      });
      if (item.proto === "dev_tool") {
        const rejected = await session.requestSave(
          createEmptySubmitPrototypeCategoryFields(),
          draft,
        );
        assert.equal(rejected.closed, false);
        assert.equal(rejected.onSavedCalled, false);
        assert.equal(updates, 0);
      }
      const ok = await session.requestSave(item.playFields, draft);
      assert.equal(ok.closed, true);
      assert.equal(updates, 1);
    }

    // publication
    {
      let updates = 0;
      const session = createNonGameEditSaveSession({
        game: emptyGame,
        prototypeCategory: item.proto,
        playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
        editMode: "publication",
        update: async () => {
          updates += 1;
        },
      });
      const outcome = await session.requestSave(item.fields, draft);
      assert.equal(outcome.closed, true);
      assert.equal(updates, 1);
    }
  }
}

// submit save-error must not auto-clear when draft is valid
{
  const { shouldAutoClearSubmitErrorOnDraftChange } = await import(
    "../lib/studio-submit-error-policy"
  );
  assert.equal(shouldAutoClearSubmitErrorOnDraftChange("save"), false);
  assert.equal(shouldAutoClearSubmitErrorOnDraftChange("validation"), true);
  assert.equal(shouldAutoClearSubmitErrorOnDraftChange(null), false);
  const fs = await import("node:fs");
  const path = await import("node:path");
  const submitPage = fs.readFileSync(
    path.join(process.cwd(), "components/studio-submit-page.tsx"),
    "utf8",
  );
  assert.match(submitPage, /submitErrorSource/);
  assert.match(submitPage, /shouldAutoClearSubmitErrorOnDraftChange/);
}

// kind validation cases A–F (shared helper)
assert.equal(
  validatePrototypePublishDestinationsForCategory("music", [
    { id: "1", kind: "", url: "", isPrimary: true },
  ]),
  "メイン公開先のURLを入力してください。",
);
assert.equal(
  validatePrototypePublishDestinationsForCategory("music", [
    { id: "1", kind: "", url: "https://example.com", isPrimary: true },
  ]),
  "公開先の種類を選んでください。",
);
assert.equal(
  validatePrototypePublishDestinationsForCategory("music", [
    {
      id: "1",
      kind: "YouTube",
      url: "https://example.com",
      isPrimary: true,
    },
  ]),
  null,
);
assert.equal(
  validatePrototypePublishDestinationsForCategory("music", [
    {
      id: "1",
      kind: "unknown-kind",
      url: "https://example.com",
      isPrimary: true,
    },
  ]),
  "公開先の種類を選んでください。",
);
assert.equal(
  validatePrototypePublishDestinationsForCategory("dev_tool", [
    {
      id: "1",
      kind: "YouTube",
      url: "https://example.com",
      isPrimary: true,
    },
  ]),
  "公開先の種類を選んでください。",
);
assert.equal(
  validatePrototypePublishDestinationsForCategory("music", [
    {
      id: "1",
      kind: "YouTube",
      url: "https://ok.example",
      isPrimary: true,
    },
    {
      id: "2",
      kind: "",
      url: "https://bad.example",
      isPrimary: false,
    },
  ]),
  "公開先の種類を選んでください。",
);

// mapping never falls back unknown → other
assert.throws(() =>
  mapPrototypePublishToFormal([
    {
      id: "1",
      kind: "not-a-real-kind",
      url: "https://example.com",
      isPrimary: true,
    },
  ]),
);

// BOOTH stays booth (not silently other)
{
  const formal = mapPrototypePublishToFormal([
    {
      id: "1",
      kind: "BOOTH",
      url: "https://booth.pm/x",
      isPrimary: true,
    },
  ]);
  assert.equal(formal[0]?.kind, "booth");
}

// panel wiring uses save session (no render-time ref write)
{
  const fs = await import("node:fs");
  const path = await import("node:path");
  const panel = fs.readFileSync(
    path.join(process.cwd(), "components/studio-overview-non-game-fields-edit-panel.tsx"),
    "utf8",
  );
  assert.match(panel, /createNonGameEditSaveSession/);
  assert.match(panel, /deferClose/);
  assert.match(panel, /queueMicrotask/);
  // seed hydrate only inside effect microtask — not during render body
  assert.doesNotMatch(
    panel,
    /if \(seed && \(fields == null/,
  );
}

console.log("studio-category-update-boundary ok");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
