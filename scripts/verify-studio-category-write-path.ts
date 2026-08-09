/**
 * Behavioral: Studio non-game category write path (no DB).
 * Usage: npx tsx scripts/verify-studio-category-write-path.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  draftToSubmitFormData,
  createEmptySubmitDraft,
} from "../lib/studio-submit-draft";
import {
  validateSubmitDraftForPost,
  validateNonGamePrototypeFieldsForSave,
} from "../hooks/use-studio-submit";
import {
  createEmptySubmitPrototypeCategoryFields,
  type SubmitPrototypeCategoryFields,
} from "../lib/prototype/studio-submit-flow";
import {
  decodeCategoryAttributesToPrototypeFields,
  encodePrototypeFieldsToCategoryAttributes,
  mapPrototypePublishToFormal,
  mergeCategoryAttributesJson,
  prototypeCategoryToProjectCategory,
  projectCategoryToPrototypeCategory,
  validatePrototypePublishDestinationsForCategory,
} from "../lib/studio-non-game-attributes";
import { projectRowToGame, submitFormToInsertRow } from "../lib/supabase/projects";
import type { ProjectRow } from "../lib/supabase/schema";
import { buildProjectEditFormDataFromGame } from "../lib/project-edit-form-data";
import { writeProjectRowWithSchemaFallback } from "../lib/supabase/project-write-compat";
import {
  runNonGameEditPersist,
  buildNonGameEditPersistPayload,
} from "../lib/studio-non-game-edit-persist";
import { EMPTY_PLAY_ENVIRONMENT_FORM } from "../lib/play-environment";
import { getPrimaryPublishDestination } from "../lib/project-publish-links";
import type { Game } from "../lib/mock-games";

const ROOT = path.resolve(import.meta.dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function baseDraft() {
  const draft = createEmptySubmitDraft();
  draft.title = "テスト作品タイトル";
  draft.description = "キャッチコピーです";
  draft.phase = "playable";
  draft.introduction = "作品紹介の本文です。";
  draft.genres = ["RPG"];
  draft.playAccessType = "free";
  draft.publishDestinations = [
    {
      id: "pub-1",
      kind: "itch",
      url: "https://example.com/play",
      usageMethod: null,
      isPrimary: true,
    },
  ];
  return draft;
}

const owner = {
  ownerId: "11111111-1111-4111-8111-111111111111",
  ownerName: "Tester",
  creator: "Tester",
};

// --- mapping helpers ---
assert.equal(prototypeCategoryToProjectCategory("music"), "audio");
assert.equal(prototypeCategoryToProjectCategory("dev_tool"), "dev-tool");
assert.equal(prototypeCategoryToProjectCategory("web_service"), "service-app");
assert.equal(projectCategoryToPrototypeCategory("audio"), "music");
assert.equal(projectCategoryToPrototypeCategory("game"), null);
assert.equal(projectCategoryToPrototypeCategory("asset"), null);

// --- audio encode / decode round-trip ---
const audioFields: SubmitPrototypeCategoryFields = {
  ...createEmptySubmitPrototypeCategoryFields(),
  kind: "楽曲",
  musicGenres: ["ポップ", "ロック"],
  musicDuration: "3:20",
  publishDestinations: [
    {
      id: "a1",
      kind: "YouTube",
      url: "https://youtube.com/watch?v=demo",
      isPrimary: true,
    },
  ],
};
const encoded = encodePrototypeFieldsToCategoryAttributes(audioFields);
const merged = mergeCategoryAttributesJson({ quickTry: true }, encoded);
assert.equal(merged.kind, "楽曲");
assert.deepEqual(merged.musicGenres, ["ポップ", "ロック"]);
assert.equal(merged.musicDuration, "3:20");
assert.equal(merged.quickTry, true);
const decoded = decodeCategoryAttributesToPrototypeFields(merged);
assert.equal(decoded.kind, "楽曲");
assert.deepEqual(decoded.musicGenres, ["ポップ", "ロック"]);
assert.equal(decoded.musicDuration, "3:20");
assert.equal(decoded.publishDestinations[0]?.kind, "YouTube");

const formal = mapPrototypePublishToFormal(audioFields.publishDestinations);
assert.equal(formal[0]?.kind, "other");
assert.equal(formal[0]?.url, "https://youtube.com/watch?v=demo");

// Finding 1: URL+empty kind / unknown / cross-category rejected before map
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
  validateNonGamePrototypeFieldsForSave("music", {
    ...audioFields,
    publishDestinations: [
      { id: "1", kind: "", url: "https://example.com", isPrimary: true },
    ],
  }).ok,
  false,
);
assert.throws(() =>
  mapPrototypePublishToFormal([
    {
      id: "1",
      kind: "ghost",
      url: "https://example.com",
      isPrimary: true,
    },
  ]),
);

// non-leading primary must win (single primary)
const multiPrimary = mapPrototypePublishToFormal([
  {
    id: "p1",
    kind: "SoundCloud",
    url: "https://soundcloud.com/a",
    isPrimary: false,
  },
  {
    id: "p2",
    kind: "YouTube",
    url: "https://youtube.com/watch?v=main",
    isPrimary: true,
  },
]);
assert.equal(multiPrimary.filter((item) => item.isPrimary).length, 1);
assert.equal(multiPrimary.find((item) => item.isPrimary)?.id, "p2");
assert.equal(
  multiPrimary.find((item) => item.isPrimary)?.url,
  "https://youtube.com/watch?v=main",
);

// --- submit form payload for audio ---
const draft = baseDraft();
draft.featureTags = ["癒し系"];
draft.genres = []; // non-game
const audioPayload = draftToSubmitFormData(draft, owner, {
  category: "audio",
  categoryAttributes: merged,
  publishDestinationsOverride: formal,
});
assert.equal(audioPayload.category, "audio");
assert.equal(audioPayload.categoryAttributes?.kind, "楽曲");
assert.ok(audioPayload.publishDestinations?.length);

const audioValidation = validateSubmitDraftForPost(draft, {
  prototypeCategory: "music",
  prototypeFields: audioFields,
});
assert.equal(audioValidation.ok, true);

// edit-path validation rejects empty publish / bad duration / missing tool usage
const noPublish = validateNonGamePrototypeFieldsForSave("music", {
  ...audioFields,
  publishDestinations: [],
});
assert.equal(noPublish.ok, false);

const badDuration = validateNonGamePrototypeFieldsForSave("music", {
  ...audioFields,
  musicDuration: "abc",
});
assert.equal(badDuration.ok, false);

const toolOkFields: SubmitPrototypeCategoryFields = {
  ...createEmptySubmitPrototypeCategoryFields(),
  kind: "デスクトップツール",
  toolUsageMethod: "ダウンロードして利用",
  publishDestinations: [
    {
      id: "t1",
      kind: "BOOTH",
      url: "https://booth.pm/demo",
      isPrimary: true,
    },
  ],
};
assert.equal(
  validateNonGamePrototypeFieldsForSave("dev_tool", toolOkFields).ok,
  true,
);
assert.equal(
  validateNonGamePrototypeFieldsForSave("dev_tool", {
    ...toolOkFields,
    toolUsageMethod: "",
  }).ok,
  false,
);
assert.equal(
  validateNonGamePrototypeFieldsForSave("dev_tool", {
    ...toolOkFields,
    publishDestinations: [
      {
        id: "1",
        kind: "YouTube",
        url: "https://example.com",
        isPrimary: true,
      },
    ],
  }).ok,
  false,
);

const serviceFields: SubmitPrototypeCategoryFields = {
  ...createEmptySubmitPrototypeCategoryFields(),
  kind: "Webサービス",
  publishDestinations: [
    {
      id: "s1",
      kind: "Webサービス",
      url: "https://example.com/app",
      isPrimary: true,
    },
  ],
};
assert.equal(
  validateNonGamePrototypeFieldsForSave("web_service", serviceFields).ok,
  true,
);

// game validation still requires genres
const gameValidation = validateSubmitDraftForPost(baseDraft());
assert.equal(gameValidation.ok, true);
const gameMissingGenre = validateSubmitDraftForPost({
  ...baseDraft(),
  genres: [],
});
assert.equal(gameMissingGenre.ok, false);

// category / category_attributes must not be silently stripped
const compatSrc = read("lib/supabase/project-write-compat.ts");
assert.ok(!/"category"/.test(compatSrc.split("OPTIONAL_PROJECT_COLUMNS")[1]?.split("]")[0] ?? ""));
assert.ok(
  !/"category_attributes"/.test(
    compatSrc.split("OPTIONAL_PROJECT_COLUMNS")[1]?.split("]")[0] ?? "",
  ),
);

async function assertCategoryWriteFailsClosed() {
  await assert.rejects(
    () =>
      writeProjectRowWithSchemaFallback(
        async () => ({
          data: null,
          error: {
            message: 'column "category" of relation "projects" does not exist',
            details: "",
            hint: "",
            code: "42703",
            name: "PostgrestError",
            toJSON() {
              return this;
            },
          } as unknown as import("@supabase/supabase-js").PostgrestError,
        }),
        { category: "audio", title: "x" },
      ),
    (err: unknown) =>
      typeof err === "object" &&
      err !== null &&
      "message" in err &&
      String((err as { message: string }).message).includes("category"),
  );
}

async function main() {
  await assertCategoryWriteFailsClosed();

  // edit panel awaits persist before close
  const editPanel = read(
    "components/studio-overview-non-game-fields-edit-panel.tsx",
  );
  assert.match(editPanel, /createNonGameEditSaveSession/);
  assert.match(editPanel, /deferClose/);
  assert.match(editPanel, /isSaving/);
  assert.match(editPanel, /setIsSaving\(true\)/);
  assert.match(editPanel, /onSaved/);

  // public SELECT columns must include category (+ attributes on detail)
  const projectsSrc = read("lib/supabase/projects.ts");
  const catalogBlock = projectsSrc.slice(
    projectsSrc.indexOf("PUBLIC_PROJECT_CATALOG_COLUMNS"),
    projectsSrc.indexOf("PUBLIC_PROJECT_DETAIL_COLUMNS"),
  );
  const detailBlock = projectsSrc.slice(
    projectsSrc.indexOf("PUBLIC_PROJECT_DETAIL_COLUMNS"),
    projectsSrc.indexOf("function linkColumnsFromForm"),
  );
  assert.match(catalogBlock, /"category"/);
  assert.doesNotMatch(catalogBlock, /"category_attributes"/);
  assert.match(detailBlock, /"category"/);
  assert.match(detailBlock, /"category_attributes"/);

  // --- projectRowToGame hydrates category ---
  const row = {
    id: "22222222-2222-4222-8222-222222222222",
    owner_id: owner.ownerId,
    owner_name: owner.ownerName,
    title: "Audio Row",
    creator: owner.creator,
    genre: "",
    genres: [],
    description: "desc",
    overview_introduction: "intro",
    phase: "playable",
    status: "playable",
    looking_for_testers: false,
    tester_slots: null,
    section: "new",
    thumbnail_url: null,
    tags: ["癒し系"],
    play_url: "https://example.com",
    steam_url: null,
    itch_url: null,
    github_url: null,
    discord_url: null,
    official_url: null,
    visibility: "public",
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    category: "audio",
    category_attributes: merged,
  } as ProjectRow;
  const game = projectRowToGame(row);
  assert.equal(game.category, "audio");
  assert.equal(
    (game.categoryAttributes as { kind?: string } | undefined)?.kind,
    "楽曲",
  );
  const editForm = buildProjectEditFormDataFromGame(game);
  assert.equal(editForm.category, "audio");
  assert.equal(editForm.categoryAttributes?.kind, "楽曲");

  // catalog-shaped row (category only) must not fall back to game
  const catalogGame = projectRowToGame({
    ...row,
    category_attributes: undefined,
  } as ProjectRow);
  assert.equal(catalogGame.category, "audio");

  // detail-shaped hydrate keeps attributes
  const detailGame = projectRowToGame(row);
  assert.equal(detailGame.category, "audio");
  assert.equal(
    (detailGame.categoryAttributes as { kind?: string }).kind,
    "楽曲",
  );

  // write-function boundary: insert row payload for 3 categories + game regression
  for (const [proto, projectCategory, fields] of [
    ["music", "audio", audioFields],
    ["dev_tool", "dev-tool", toolOkFields],
    ["web_service", "service-app", serviceFields],
  ] as const) {
    const categoryDraft = baseDraft();
    categoryDraft.genres = [];
    categoryDraft.featureTags = ["癒し系"];
    const form = draftToSubmitFormData(categoryDraft, owner, {
      category: projectCategory,
      categoryAttributes: encodePrototypeFieldsToCategoryAttributes(fields),
      publishDestinationsOverride: mapPrototypePublishToFormal(
        fields.publishDestinations,
      ),
    });
    assert.equal(
      validateSubmitDraftForPost(categoryDraft, {
        prototypeCategory: proto,
        prototypeFields: fields,
      }).ok,
      true,
    );
    const insertRow = submitFormToInsertRow(form, owner, {
      deferThumbnails: true,
    });
    assert.equal(insertRow.category, projectCategory);
    assert.equal(
      (insertRow.category_attributes as { kind?: string } | undefined)?.kind,
      fields.kind,
    );
    const hydrated = projectRowToGame({
      ...row,
      id: `${projectCategory}-id`,
      title: form.title,
      category: insertRow.category,
      category_attributes: insertRow.category_attributes,
      tags: insertRow.tags,
      play_url:
        getPrimaryPublishDestination(
          form.publishDestinations ?? [],
        )?.url ?? row.play_url,
      publish_destinations: form.publishDestinations,
    } as ProjectRow);
    assert.equal(hydrated.category, projectCategory);
    const updateForm = buildProjectEditFormDataFromGame(hydrated);
    assert.equal(updateForm.category, projectCategory);
    assert.equal(updateForm.categoryAttributes?.kind, fields.kind);
  }

  const gameForm = draftToSubmitFormData(baseDraft(), owner);
  assert.equal(gameForm.category ?? "game", "game");
  const gameInsert = submitFormToInsertRow(gameForm, owner, {
    deferThumbnails: true,
  });
  // game may omit explicit category (DB default) or set game — never non-game
  assert.ok(
    gameInsert.category === undefined || gameInsert.category === "game",
  );
  assert.ok(Array.isArray(gameInsert.genres) && gameInsert.genres.length > 0);

  // edit persist: invalid must not call update; success calls update once; failure throws keep close=false
  let updateCalls = 0;
  const invalid = await runNonGameEditPersist({
    game,
    prototypeCategory: "music",
    fields: { ...audioFields, publishDestinations: [] },
    draft: {
      ...createEmptySubmitDraft(),
      featureTags: ["癒し系"],
      visibility: "public",
    },
    playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
    editMode: "publication",
    update: async () => {
      updateCalls += 1;
    },
  });
  assert.equal(invalid.ok, false);
  assert.equal(updateCalls, 0);

  const plannedOk = buildNonGameEditPersistPayload({
    game,
    prototypeCategory: "music",
    fields: audioFields,
    draft: {
      ...createEmptySubmitDraft(),
      featureTags: ["癒し系"],
      visibility: "public",
    },
    playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
    editMode: "publication",
  });
  assert.equal(plannedOk.ok, true);

  updateCalls = 0;
  const ok = await runNonGameEditPersist({
    game,
    prototypeCategory: "music",
    fields: audioFields,
    draft: {
      ...createEmptySubmitDraft(),
      featureTags: ["癒し系"],
      visibility: "public",
    },
    playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
    editMode: "publication",
    update: async () => {
      updateCalls += 1;
    },
  });
  assert.equal(ok.ok, true);
  assert.equal(updateCalls, 1);

  let threw = false;
  try {
    await runNonGameEditPersist({
      game,
      prototypeCategory: "music",
      fields: audioFields,
      draft: {
        ...createEmptySubmitDraft(),
        featureTags: ["癒し系"],
        visibility: "public",
      },
      playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
      editMode: "publication",
      update: async () => {
        throw new Error("db down");
      },
    });
  } catch {
    threw = true;
  }
  assert.equal(threw, true);

  // --- UI: no save-block toast for non-game ---
  const submitPage = read("components/studio-submit-page.tsx");
  assert.doesNotMatch(submitPage, /このPreviewでは保存されません/);
  assert.match(submitPage, /prototypeCategory,\s*prototypeFields/);

  const insertSrc = read("lib/supabase/projects.ts");
  assert.match(insertSrc, /category: normalizeProjectCategory/);
  assert.match(insertSrc, /category_attributes/);

  // asset is in formal Studio picker (project-categories order), not prototype flow ids
  const flow = read("lib/prototype/studio-submit-flow.ts");
  assert.doesNotMatch(flow, /querySlug: "asset"/);
  assert.doesNotMatch(flow, /id: "asset"/);
  const studioOptions = read("lib/studio-submit-category-options.ts");
  assert.match(studioOptions, /PROJECT_CATEGORY_IDS/);
  assert.match(studioOptions, /asset:/);
  assert.match(submitPage, /projectCategory/);

  // seed genre/tag distribution notes
  const seed = read("scripts/staging-only/player-ia-staging-seed.sql");
  assert.match(seed, /ARRAY\['アクション', 'RPG'\]/);
  assert.match(
    seed,
    /ARRAY\['ピクセルアート', '短時間プレイ', 'forge-ia-seed-v1'\]/,
  );
  assert.match(seed, /ARRAY\['カードゲーム'\]/);
  assert.doesNotMatch(seed, /ARRAY\['カード'\]::text\[\]/);

  // silence unused Game type import check path
  const _g: Game = game;
  assert.equal(_g.category, "audio");

  console.log("studio-category-write-path ok");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
