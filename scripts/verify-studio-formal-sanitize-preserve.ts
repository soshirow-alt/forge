/**
 * Finding 2: save-boundary sanitize must not silent-drop legacy existing
 * unknowns, and a genuinely NEW invalid value must reject the save (not
 * silently succeed with the invalid value stripped).
 *
 * Cases A–F (Owner):
 *   A. existing unknown + unrelated field edit           → preserved
 *   B. existing unknown + section open/apply no change   → preserved
 *   C. formal valid new value                            → ok
 *   D. tampered new unknown value                        → validation failure
 *   E. user explicit removal of a legacy value            → removed
 *   F. system/safety tags preserved on unrelated edit     → preserved
 *
 * Covers: non-game prototype fields (lib/studio-non-game-attributes.ts +
 * lib/studio-non-game-edit-persist.ts), Asset structured fields
 * (lib/studio-asset-edit-persist.ts), and the create/submit path (baseline
 * none — unknown must reject, never silently succeed).
 *
 * Usage: npx tsx scripts/verify-studio-formal-sanitize-preserve.ts
 */
import assert from "node:assert/strict";
import {
  buildNonGameEditPersistPayload,
} from "../lib/studio-non-game-edit-persist";
import { buildAssetEditPersistPayload } from "../lib/studio-asset-edit-persist";
import {
  decodeCategoryAttributesToPrototypeFields,
  sanitizeAssetFieldsForSave,
  sanitizeNonGamePrototypeFieldsForSave,
  type SubmitAssetCategoryFields,
} from "../lib/studio-non-game-attributes";
import {
  createEmptySubmitPrototypeCategoryFields,
  type SubmitPrototypeCategory,
  type SubmitPrototypeCategoryFields,
} from "../lib/prototype/studio-submit-flow";
import { createEmptySubmitDraft, type SubmitDraftState } from "../lib/studio-submit-draft";
import { EMPTY_PLAY_ENVIRONMENT_FORM, TRUST_VERIFIED_TAG } from "../lib/play-environment";
import { createEmptyPublishDestination } from "../lib/project-publish-links";
import { normalizeFormalMultiForSave } from "../lib/project-formal-filter-registry";
import type { ProjectCategoryId } from "../lib/project-categories";
import type { Game } from "../lib/mock-games";

const OWNER_ID = "11111111-1111-4111-8111-111111111111";
const PROJECT_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const LEGACY_UNKNOWN_MOOD = "廃止された雰囲気";
const LEGACY_UNKNOWN_ASSET_TASTE = "廃止されたテイスト";
const TAMPERED_UNKNOWN_MOOD = "捏造された雰囲気";

function audioGame(overrides: Partial<Game> = {}): Game {
  return {
    id: PROJECT_ID,
    title: "sanitize保存境界テスト",
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
    tags: ["癒し系", TRUST_VERIFIED_TAG, "古いレガシータグ"],
    playUrl: "https://youtube.com/watch?v=audio",
    ownerId: OWNER_ID,
    ownerName: "Tester",
    visibility: "public",
    playableVersion: "1.0.0",
    releaseStatus: "in_development",
    playAccessType: "free",
    ageRating: "general",
    category: "audio",
    categoryAttributes: {
      kinds: ["楽曲"],
      musicGenres: ["ポップ"],
      moods: [LEGACY_UNKNOWN_MOOD],
      purposes: ["フィールド・探索"],
      nonGamePublishDestinations: [
        {
          id: "a1",
          kind: "YouTube",
          url: "https://youtube.com/watch?v=audio",
          isPrimary: true,
        },
      ],
    } as unknown as Game["categoryAttributes"],
    publishDestinations: [
      createEmptyPublishDestination({
        id: "a1",
        kind: "other",
        url: "https://youtube.com/watch?v=audio",
        usageMethod: "other",
        isPrimary: true,
      }),
    ],
    ...overrides,
  };
}

function draftFor(game: Game): SubmitDraftState {
  return {
    ...createEmptySubmitDraft(),
    featureTags: ["癒し系" as const],
    visibility: game.visibility === "private" ? "private" : "public",
  };
}

function fieldsFromGame(game: Game): SubmitPrototypeCategoryFields {
  return decodeCategoryAttributesToPrototypeFields(game.categoryAttributes);
}

// ─── A. existing unknown + unrelated field edit → preserved ────────────────
{
  const game = audioGame();
  const fields: SubmitPrototypeCategoryFields = {
    ...fieldsFromGame(game),
    musicDuration: "2:10", // touch play-info only; moods untouched
  };
  const result = buildNonGameEditPersistPayload({
    game,
    prototypeCategory: "music",
    fields,
    draft: draftFor(game),
    playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
    editMode: "play-info",
  });
  assert.equal(result.ok, true, "case A: editing an unrelated field must not reject");
  if (!result.ok) throw new Error("unreachable");
  const attrs = result.payload.categoryAttributes as Record<string, unknown>;
  assert.deepEqual(
    attrs.moods,
    [LEGACY_UNKNOWN_MOOD],
    "case A: legacy existing unknown mood must survive an unrelated (play-info) edit",
  );
  assert.equal(attrs.musicDuration, "2:10");
}

// ─── B. existing unknown + section open/apply with NO change → preserved ───
{
  const game = audioGame();
  const fields = fieldsFromGame(game); // apply with literally no change
  const result = buildNonGameEditPersistPayload({
    game,
    prototypeCategory: "music",
    fields,
    draft: draftFor(game),
    playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
    editMode: "genres-tags",
  });
  assert.equal(result.ok, true, "case B: re-saving with no change must not reject");
  if (!result.ok) throw new Error("unreachable");
  const attrs = result.payload.categoryAttributes as Record<string, unknown>;
  assert.deepEqual(
    attrs.moods,
    [LEGACY_UNKNOWN_MOOD],
    "case B: legacy existing unknown mood must survive a no-op section re-save",
  );
}

// ─── C. formal valid NEW value → ok ─────────────────────────────────────────
// purposes is owned by the genres-tags/classification panel (that panel is
// what actually renders 用途 alongside 種類/雰囲気), not play-info.
{
  const game = audioGame();
  const fields: SubmitPrototypeCategoryFields = {
    ...fieldsFromGame(game),
    purposes: ["バトル"], // valid canonical value, different from baseline
  };
  const result = buildNonGameEditPersistPayload({
    game,
    prototypeCategory: "music",
    fields,
    draft: draftFor(game),
    playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
    editMode: "genres-tags",
  });
  assert.equal(result.ok, true, "case C: a new canonical value must be accepted");
  if (!result.ok) throw new Error("unreachable");
  const attrs = result.payload.categoryAttributes as Record<string, unknown>;
  assert.deepEqual(attrs.purposes, ["バトル"]);
  // untouched legacy unknown field still preserved alongside the valid change
  assert.deepEqual(attrs.moods, [LEGACY_UNKNOWN_MOOD]);
}

// ─── D. tampered NEW unknown value → explicit validation failure ───────────
{
  const game = audioGame();
  const fields: SubmitPrototypeCategoryFields = {
    ...fieldsFromGame(game),
    moods: [LEGACY_UNKNOWN_MOOD, TAMPERED_UNKNOWN_MOOD], // baseline unknown + brand-new unknown
  };
  const result = buildNonGameEditPersistPayload({
    game,
    prototypeCategory: "music",
    fields,
    draft: draftFor(game),
    playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
    editMode: "play-info",
  });
  assert.equal(
    result.ok,
    false,
    "case D: a genuinely new unknown value (not baseline, not canonical) must reject, not silently succeed",
  );
}

// ─── E. user explicit removal of a legacy value → removed ──────────────────
// moods is owned by the genres-tags/classification panel — removing it via
// that panel's editMode is the only way it is actually written back.
{
  const game = audioGame();
  const fields: SubmitPrototypeCategoryFields = {
    ...fieldsFromGame(game),
    moods: [], // explicit removal
  };
  const result = buildNonGameEditPersistPayload({
    game,
    prototypeCategory: "music",
    fields,
    draft: draftFor(game),
    playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
    editMode: "genres-tags",
  });
  assert.equal(result.ok, true, "case E: explicit removal of a legacy value must succeed");
  if (!result.ok) throw new Error("unreachable");
  const attrs = result.payload.categoryAttributes as Record<string, unknown>;
  assert.equal("moods" in attrs, false, "case E: removed moods must not be written back");
}

// ─── F. system/safety tags preserved on an unrelated category edit ─────────
{
  const game = audioGame();
  const fields: SubmitPrototypeCategoryFields = {
    ...fieldsFromGame(game),
    musicDuration: "1:30",
  };
  const result = buildNonGameEditPersistPayload({
    game,
    prototypeCategory: "music",
    fields,
    draft: draftFor(game),
    playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
    editMode: "play-info",
  });
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("unreachable");
  assert.ok(
    (result.payload.tags ?? []).includes(TRUST_VERIFIED_TAG),
    "case F: trust tag must survive an unrelated section edit",
  );
  assert.ok(
    (result.payload.tags ?? []).includes("古いレガシータグ"),
    "case F: unknown legacy tag must survive an unrelated section edit",
  );
}

// ─── Asset structured fields: same A/D/E semantics ──────────────────────────
function assetGame(overrides: Partial<Game> = {}): Game {
  return {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    title: "アセットsanitize保存境界テスト",
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
    tags: [],
    playUrl: "https://example.com/asset",
    ownerId: OWNER_ID,
    ownerName: "Tester",
    visibility: "public",
    playableVersion: "1.0.0",
    releaseStatus: "in_development",
    playAccessType: "free",
    ageRating: "general",
    category: "asset",
    categoryAttributes: {
      tastes: [LEGACY_UNKNOWN_ASSET_TASTE],
    } as unknown as Game["categoryAttributes"],
    assetKinds: ["キャラクター"],
    publishDestinations: [
      createEmptyPublishDestination({
        id: "pub-1",
        kind: "other",
        url: "https://example.com/asset",
        usageMethod: "other",
        isPrimary: true,
      }),
    ],
    ...overrides,
  };
}

// A. existing unknown taste + unrelated field (formats) edit → preserved
{
  const game = assetGame();
  const fields: SubmitAssetCategoryFields = {
    kinds: ["キャラクター"],
    formats: ["2D"], // touch a different field only
    tastes: [LEGACY_UNKNOWN_ASSET_TASTE],
    tools: [],
  };
  const result = buildAssetEditPersistPayload({ game, fields });
  assert.equal(result.ok, true, "asset case A: editing an unrelated field must not reject");
  if (!result.ok) throw new Error("unreachable");
  const attrs = result.payload.categoryAttributes as Record<string, unknown>;
  assert.deepEqual(
    attrs.tastes,
    [LEGACY_UNKNOWN_ASSET_TASTE],
    "asset case A: legacy existing unknown taste must survive an unrelated edit",
  );
  assert.deepEqual(attrs.formats, ["2D"]);
}

// D. tampered new unknown taste → reject
{
  const game = assetGame();
  const fields: SubmitAssetCategoryFields = {
    kinds: ["キャラクター"],
    formats: [],
    tastes: [LEGACY_UNKNOWN_ASSET_TASTE, "捏造されたテイスト"],
    tools: [],
  };
  const result = buildAssetEditPersistPayload({ game, fields });
  assert.equal(
    result.ok,
    false,
    "asset case D: a genuinely new unknown taste must reject, not silently succeed",
  );
}

// E. user explicit removal of legacy taste → removed
{
  const game = assetGame();
  const fields: SubmitAssetCategoryFields = {
    kinds: ["キャラクター"],
    formats: [],
    tastes: [],
    tools: [],
  };
  const result = buildAssetEditPersistPayload({ game, fields });
  assert.equal(result.ok, true, "asset case E: explicit removal must succeed");
  if (!result.ok) throw new Error("unreachable");
  const attrs = result.payload.categoryAttributes as Record<string, unknown>;
  assert.equal("tastes" in attrs, false, "asset case E: removed taste must not be written back");
}

// ─── Create/submit path (baseline none): unknown must REJECT, never silently succeed ───
{
  const invalidPrototype: SubmitPrototypeCategoryFields = {
    ...createEmptySubmitPrototypeCategoryFields(),
    kinds: ["楽曲"],
    moods: ["捏造された雰囲気"],
  };
  const result = sanitizeNonGamePrototypeFieldsForSave("music", invalidPrototype);
  assert.equal(
    result.ok,
    false,
    "create path: an unknown value with no baseline must reject (nothing persisted yet)",
  );

  const validPrototype: SubmitPrototypeCategoryFields = {
    ...createEmptySubmitPrototypeCategoryFields(),
    kinds: ["楽曲"],
    moods: ["明るい"],
  };
  const okResult = sanitizeNonGamePrototypeFieldsForSave("music", validPrototype);
  assert.equal(okResult.ok, true, "create path: canonical values must pass with no baseline");

  const invalidAsset: SubmitAssetCategoryFields = {
    kinds: ["キャラクター"],
    formats: [],
    tastes: ["捏造されたテイスト"],
    tools: [],
  };
  const assetResult = sanitizeAssetFieldsForSave(invalidAsset);
  assert.equal(
    assetResult.ok,
    false,
    "create path: an unknown asset taste with no baseline must reject",
  );
}

// ─── HIGH finding regression: genres-tags panel owns moods/purposes/features ──
// (`StudioSubmitPrototypeClassificationEditPanel` is the panel that actually
// renders/edits them, per components/studio-submit-edit-panels.tsx) — a
// genres-tags save must persist them, and a play-info save must not.
function nonGameGame(
  category: Extract<ProjectCategoryId, "audio" | "dev-tool" | "service-app">,
  overrides: Partial<Game> = {},
): Game {
  return {
    id: `regression-${category}`,
    title: "属性所有者検証",
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
    tags: [],
    playUrl: "https://example.com/work",
    ownerId: OWNER_ID,
    ownerName: "Tester",
    visibility: "public",
    playableVersion: "1.0.0",
    releaseStatus: "in_development",
    playAccessType: "free",
    ageRating: "general",
    category,
    categoryAttributes: {},
    publishDestinations: [
      createEmptyPublishDestination({
        id: "pub-1",
        kind: "other",
        url: "https://example.com/work",
        usageMethod: "other",
        isPrimary: true,
      }),
    ],
    ...overrides,
  };
}

const OWNERSHIP_REGRESSION_CASES: Array<{
  category: Extract<ProjectCategoryId, "audio" | "dev-tool" | "service-app">;
  proto: SubmitPrototypeCategory;
  patch: Partial<SubmitPrototypeCategoryFields>;
  assertOwnedKeys: (attrs: Record<string, unknown>) => void;
}> = [
  {
    category: "audio",
    proto: "music",
    patch: { kinds: ["楽曲"], moods: ["明るい"], purposes: ["バトル"] },
    assertOwnedKeys: (attrs) => {
      assert.deepEqual(attrs.moods, ["明るい"], "audio genres-tags save must persist moods");
      assert.deepEqual(attrs.purposes, ["バトル"], "audio genres-tags save must persist purposes");
    },
  },
  {
    category: "dev-tool",
    proto: "dev_tool",
    patch: { kinds: ["CLI"], features: ["軽量"] },
    assertOwnedKeys: (attrs) => {
      assert.deepEqual(attrs.features, ["軽量"], "dev-tool genres-tags save must persist features");
    },
  },
  {
    category: "service-app",
    proto: "web_service",
    patch: { kinds: ["Webサービス"], purposes: ["制作支援"], features: ["AI対応"] },
    assertOwnedKeys: (attrs) => {
      assert.deepEqual(
        attrs.purposes,
        ["制作支援"],
        "service-app genres-tags save must persist purposes",
      );
      assert.deepEqual(
        attrs.features,
        ["AI対応"],
        "service-app genres-tags save must persist features",
      );
    },
  },
];

for (const testCase of OWNERSHIP_REGRESSION_CASES) {
  const game = nonGameGame(testCase.category);
  const fields: SubmitPrototypeCategoryFields = {
    ...createEmptySubmitPrototypeCategoryFields(),
    ...testCase.patch,
  };
  const result = buildNonGameEditPersistPayload({
    game,
    prototypeCategory: testCase.proto,
    fields,
    draft: draftFor(game),
    playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
    editMode: "genres-tags",
  });
  assert.equal(
    result.ok,
    true,
    `${testCase.category} genres-tags save with moods/purposes/features must succeed`,
  );
  if (!result.ok) throw new Error("unreachable");
  testCase.assertOwnedKeys(
    result.payload.categoryAttributes as Record<string, unknown>,
  );
}

// play-info save must NOT introduce moods/purposes even when the in-session
// fields object carries them — ownership stays with genres-tags. Locks the
// HIGH-finding fix against silently drifting back.
{
  const game = nonGameGame("audio");
  const fields: SubmitPrototypeCategoryFields = {
    ...createEmptySubmitPrototypeCategoryFields(),
    kinds: ["楽曲"],
    musicDuration: "1:30",
    moods: ["明るい"],
    purposes: ["バトル"],
  };
  const result = buildNonGameEditPersistPayload({
    game,
    prototypeCategory: "music",
    fields,
    draft: draftFor(game),
    playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
    editMode: "play-info",
  });
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("unreachable");
  const attrs = result.payload.categoryAttributes as Record<string, unknown>;
  assert.equal(
    "moods" in attrs,
    false,
    "play-info save must not write moods — that key is owned by genres-tags",
  );
  assert.equal(
    "purposes" in attrs,
    false,
    "play-info save must not write purposes — that key is owned by genres-tags",
  );
  assert.equal(attrs.musicDuration, "1:30");
}

// ─── MEDIUM finding regression: normalizeFormalMultiForSave over-max ────────
// preserve (baseline-only) vs reject (new addition on top of over-max) ──────
{
  // audio_moods maxSelection is 3 — 4 canonical values already persisted
  // (e.g. from before maxSelection existed/shrank) is the legacy over-max case.
  const legacyOverMax = ["明るい", "穏やか", "楽しい・コミカル", "切ない"];

  const preserved = normalizeFormalMultiForSave({
    next: legacyOverMax,
    baseline: legacyOverMax,
    fieldId: "audio_moods",
  });
  assert.equal(
    preserved.ok,
    true,
    "legacy over-max baseline (untouched) must be preserved, not rejected",
  );
  if (preserved.ok) {
    assert.deepEqual(preserved.values, legacyOverMax);
  }

  const withNewAddition = [...legacyOverMax, "壮大"];
  const rejected = normalizeFormalMultiForSave({
    next: withNewAddition,
    baseline: legacyOverMax,
    fieldId: "audio_moods",
  });
  assert.equal(
    rejected.ok,
    false,
    "adding a new value on top of a legacy over-max baseline must reject",
  );

  const createOverMax = normalizeFormalMultiForSave({
    next: legacyOverMax,
    fieldId: "audio_moods",
  });
  assert.equal(
    createOverMax.ok,
    false,
    "create path (no baseline) over-max must reject even with canonical values",
  );
}

console.log("studio-formal-sanitize-preserve ok");
