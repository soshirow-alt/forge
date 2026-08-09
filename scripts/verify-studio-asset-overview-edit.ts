/**
 * Asset Studio overview edit: hydrate → edit → save → clear optional fields
 * (mock DB, no write). Covers Codex finding 1 (structured asset edit) and
 * finding 4 (maxSelection enforcement) for the asset kinds/formats/tastes/tools
 * panel.
 * Usage: npx tsx scripts/verify-studio-asset-overview-edit.ts
 */
import assert from "node:assert/strict";
import {
  decodeCategoryAttributesToAssetFields,
  encodeAssetFieldsToCategoryAttributes,
  type SubmitAssetCategoryFields,
} from "../lib/studio-non-game-attributes";
import {
  buildAssetEditPersistPayload,
} from "../lib/studio-asset-edit-persist";
import {
  ASSET_TOOL_OPTIONS,
  getFormalFilterByFieldId,
} from "../lib/project-formal-filter-registry";
import type { Game } from "../lib/mock-games";
import { createEmptyPublishDestination } from "../lib/project-publish-links";

const OWNER_ID = "11111111-1111-4111-8111-111111111111";
const PROJECT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function baseAssetGame(overrides: Partial<Game> = {}): Game {
  return {
    id: PROJECT_ID,
    title: "アセット編集テスト",
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
    categoryAttributes: {},
    assetKinds: [],
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

// 1. Hydrate: decodeCategoryAttributesToAssetFields reads dedicated asset_kinds
//    column (not category_attributes) for kinds, and category_attributes for
//    formats/tastes/tools. Unrelated category_attributes keys are untouched.
{
  const game = baseAssetGame({
    assetKinds: ["キャラクター", "背景・マップ"],
    categoryAttributes: {
      formats: ["2D"],
      tastes: ["アニメ・トゥーン"],
      tools: ["Unity"],
      unrelatedFutureKey: "keep-me",
    } as unknown as Game["categoryAttributes"],
  });
  const decoded = decodeCategoryAttributesToAssetFields(
    game.categoryAttributes,
    game.assetKinds,
  );
  assert.deepEqual(decoded, {
    kinds: ["キャラクター", "背景・マップ"],
    formats: ["2D"],
    tastes: ["アニメ・トゥーン"],
    tools: ["Unity"],
  });
}

// 2. Save: buildAssetEditPersistPayload preserves unrelated category_attributes
//    keys, writes canonical kinds to the dedicated assetKinds field, keeps
//    category "asset".
{
  const game = baseAssetGame({
    assetKinds: ["キャラクター"],
    categoryAttributes: {
      formats: ["2D"],
      unrelatedFutureKey: "keep-me",
    } as unknown as Game["categoryAttributes"],
  });
  const nextFields: SubmitAssetCategoryFields = {
    kinds: ["キャラクター"],
    formats: ["2D", "3D"],
    tastes: ["アニメ・トゥーン"],
    tools: [],
  };
  const result = buildAssetEditPersistPayload({ game, fields: nextFields });
  assert.equal(result.ok, true, "valid asset edit must build a payload");
  if (!result.ok) throw new Error("unreachable");
  assert.equal(result.payload.category, "asset");
  assert.deepEqual(result.payload.assetKinds, ["キャラクター"]);
  const attrs = result.payload.categoryAttributes as Record<string, unknown>;
  assert.deepEqual(attrs.formats, ["2D", "3D"]);
  assert.deepEqual(attrs.tastes, ["アニメ・トゥーン"]);
  assert.equal("tools" in attrs, false, "empty tools must not be written");
  assert.equal(attrs.unrelatedFutureKey, "keep-me", "unrelated key preserved");
}

// 2b. Finding 2 — new invalid (not baseline, not canonical) must REJECT, not
//    be silently stripped. "背景・マップ" is NOT a canonical asset_kind label
//    (canonical split: "背景・風景" / "マップ・タイル") and is not present in
//    this game's baseline assetKinds, so a save that includes it must fail
//    closed with an explicit validation error instead of silently persisting
//    only the remaining canonical values.
{
  const game = baseAssetGame({ assetKinds: ["キャラクター"] });
  const nextFields: SubmitAssetCategoryFields = {
    kinds: ["キャラクター", "背景・マップ"],
    formats: [],
    tastes: [],
    tools: [],
  };
  const result = buildAssetEditPersistPayload({ game, fields: nextFields });
  assert.equal(
    result.ok,
    false,
    "new invalid asset kind (not baseline, not canonical) must reject the save",
  );
}

// 2b. Category-scoped merge (finding 2): saving the Asset panel must not wipe
//    known category_attributes keys owned by OTHER category panels (kind/
//    kinds/purposes/features/nonGamePublishDestinations) — only Asset's own
//    formats/tastes/tools are replaced/cleared.
{
  const game = baseAssetGame({
    assetKinds: ["キャラクター"],
    categoryAttributes: {
      formats: ["2D"],
      tastes: ["アニメ・トゥーン"],
      tools: ["Unity"],
      // Not owned by the Asset panel — must survive an Asset save untouched.
      kind: "Webサービス",
      kinds: ["Webサービス"],
      purposes: ["制作支援"],
      features: ["AI対応"],
      nonGamePublishDestinations: [
        { id: "pub-x", kind: "自サイト", url: "https://example.com", isPrimary: true },
      ],
    } as unknown as Game["categoryAttributes"],
  });
  const nextFields: SubmitAssetCategoryFields = {
    kinds: ["キャラクター"],
    formats: [],
    tastes: [],
    tools: [],
  };
  const result = buildAssetEditPersistPayload({ game, fields: nextFields });
  assert.equal(result.ok, true, "valid asset edit must build a payload");
  if (!result.ok) throw new Error("unreachable");
  const attrs = result.payload.categoryAttributes as Record<string, unknown>;
  assert.equal("formats" in attrs, false, "cleared Asset-owned formats must be removed");
  assert.equal("tastes" in attrs, false, "cleared Asset-owned tastes must be removed");
  assert.equal("tools" in attrs, false, "cleared Asset-owned tools must be removed");
  assert.equal(attrs.kind, "Webサービス", "other-panel kind must survive an Asset save");
  assert.deepEqual(attrs.kinds, ["Webサービス"], "other-panel kinds must survive an Asset save");
  assert.deepEqual(attrs.purposes, ["制作支援"], "other-panel purposes must survive an Asset save");
  assert.deepEqual(attrs.features, ["AI対応"], "other-panel features must survive an Asset save");
  assert.deepEqual(
    attrs.nonGamePublishDestinations,
    [{ id: "pub-x", kind: "自サイト", url: "https://example.com", isPrimary: true }],
    "other-panel nonGamePublishDestinations must survive an Asset save",
  );
}

// 3. Clear: saving with empty formats/tastes/tools removes them from
//    category_attributes (registry optional fields clear via []).
{
  const game = baseAssetGame({
    assetKinds: ["キャラクター"],
    categoryAttributes: {
      formats: ["2D"],
      tastes: ["アニメ・トゥーン"],
      tools: ["Unity"],
    } as unknown as Game["categoryAttributes"],
  });
  const cleared: SubmitAssetCategoryFields = {
    kinds: ["キャラクター"],
    formats: [],
    tastes: [],
    tools: [],
  };
  const result = buildAssetEditPersistPayload({ game, fields: cleared });
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("unreachable");
  const attrs = result.payload.categoryAttributes as Record<string, unknown>;
  assert.equal("formats" in attrs, false);
  assert.equal("tastes" in attrs, false);
  assert.equal("tools" in attrs, false);
}

// 4. Required kinds: clearing kinds down to zero must fail closed (asset kind
//    required, mirrors genre-required for game).
{
  const game = baseAssetGame({ assetKinds: ["キャラクター"] });
  const result = buildAssetEditPersistPayload({
    game,
    fields: { kinds: [], formats: [], tastes: [], tools: [] },
  });
  assert.equal(result.ok, false, "clearing all kinds must fail closed");
}

// 5. encode/decode round-trip stability for a fully populated fields object.
{
  const fields: SubmitAssetCategoryFields = {
    kinds: ["キャラクター"],
    formats: ["2D"],
    tastes: ["アニメ・トゥーン"],
    tools: ["Unity"],
  };
  const attrs = encodeAssetFieldsToCategoryAttributes(fields);
  const decoded = decodeCategoryAttributesToAssetFields(attrs, fields.kinds);
  assert.deepEqual(decoded, fields);
}

// 6. maxSelection enforcement (finding 4): registry max is enforced at the
//    save boundary (`sanitizeAssetFieldsForSave` → `normalizeFormalMultiForSave`),
//    which REJECTS an oversized payload introduced by NEW (non-baseline)
//    values instead of silently capping it (Finding 2: an over-cardinality
//    tampered/stale buffer is invalid input, not something to quietly
//    truncate). `validateAssetFields` itself only checks the required rule —
//    max enforcement intentionally lives at the save boundary so a legacy
//    over-max baseline can be preserved (see case 6b).
{
  const toolMax = getFormalFilterByFieldId("asset_tools")?.maxSelection;
  assert.ok(toolMax && toolMax > 0);

  // Uses real allowlisted option values so this exercises the maxSelection
  // reject specifically (allowlist rejection is covered separately below).
  const game = baseAssetGame({ assetKinds: [] });
  const oversizedTools = ASSET_TOOL_OPTIONS.slice(0, (toolMax as number) + 3);
  assert.ok(
    oversizedTools.length === (toolMax as number) + 3,
    "fixture must have enough canonical tool options to exceed maxSelection",
  );
  const overMaxResult = buildAssetEditPersistPayload({
    game,
    fields: { kinds: ["キャラクター"], formats: [], tastes: [], tools: [...oversizedTools] },
  });
  assert.equal(
    overMaxResult.ok,
    false,
    "exceeding tool maxSelection with newly-added values must reject the save, not silently cap",
  );
}

// 6b. Legacy over-max baseline (all kept values already persisted) must be
//    PRESERVED as-is on an edit to a different field — not silently
//    truncated, and not hard-rejected either.
{
  const toolMax = getFormalFilterByFieldId("asset_tools")?.maxSelection;
  assert.ok(toolMax && toolMax > 0);
  const legacyOverMaxTools = ASSET_TOOL_OPTIONS.slice(0, (toolMax as number) + 2);
  assert.ok(legacyOverMaxTools.length > (toolMax as number));
  const game = baseAssetGame({
    assetKinds: ["キャラクター"],
    categoryAttributes: {
      tools: [...legacyOverMaxTools],
    } as unknown as Game["categoryAttributes"],
  });
  const result = buildAssetEditPersistPayload({
    game,
    // Re-save with no change to tools, touching formats instead.
    fields: { kinds: ["キャラクター"], formats: ["2D"], tastes: [], tools: [...legacyOverMaxTools] },
  });
  assert.equal(
    result.ok,
    true,
    "legacy over-max tools (untouched) must be preserved, not rejected or truncated",
  );
  if (!result.ok) throw new Error("unreachable");
  const attrs = result.payload.categoryAttributes as Record<string, unknown>;
  assert.deepEqual(
    attrs.tools,
    legacyOverMaxTools,
    "legacy over-max tools must survive intact",
  );
}

// 7. Allowlist enforcement (Finding 2): a genuinely NEW unknown/obsolete
//    value (not present in this game's baseline) against the registry
//    allowlist must REJECT the save with an explicit validation error — not
//    be silently stripped while the remaining canonical values persist.
{
  const game = baseAssetGame({ assetKinds: [] });
  const result = buildAssetEditPersistPayload({
    game,
    fields: {
      kinds: ["キャラクター", "背景・マップ", "存在しない種別"],
      formats: ["2D", "存在しないフォーマット"],
      tastes: ["アニメ・トゥーン", "廃止されたテイスト"],
      tools: ["Unity", "廃止ツール"],
    },
  });
  assert.equal(
    result.ok,
    false,
    "new unknown/non-canonical asset values (no baseline) must reject the save",
  );
}

// 7b. Legacy EXISTING unknown (baseline) must be PRESERVED, not dropped and
//    not rejected — the same "unknown" value that would reject in 7 must
//    pass through untouched when it is already present in this game's
//    baseline (came from a prior schema / registry change).
{
  const game = baseAssetGame({
    assetKinds: ["廃止された種別"],
    categoryAttributes: {
      tastes: ["廃止されたテイスト"],
    } as unknown as Game["categoryAttributes"],
  });
  const result = buildAssetEditPersistPayload({
    game,
    // Re-save with no change to kinds/tastes, but touch formats (a different
    // field) — the legacy unknown values must survive untouched.
    fields: {
      kinds: ["廃止された種別"],
      formats: ["2D"],
      tastes: ["廃止されたテイスト"],
      tools: [],
    },
  });
  assert.equal(result.ok, true, "legacy existing unknown values must be preserved, not rejected");
  if (!result.ok) throw new Error("unreachable");
  assert.deepEqual(
    result.payload.assetKinds,
    ["廃止された種別"],
    "legacy existing asset kind must survive an edit to an unrelated field",
  );
  const attrs = result.payload.categoryAttributes as Record<string, unknown>;
  assert.deepEqual(
    attrs.tastes,
    ["廃止されたテイスト"],
    "legacy existing taste must survive an edit to an unrelated field",
  );
  assert.deepEqual(attrs.formats, ["2D"]);
}

// 7c. User explicit removal of a legacy value must succeed (removed, not
//    force-preserved just because it was in baseline).
{
  const game = baseAssetGame({ assetKinds: ["廃止された種別"] });
  const result = buildAssetEditPersistPayload({
    game,
    fields: { kinds: ["キャラクター"], formats: [], tastes: [], tools: [] },
  });
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("unreachable");
  assert.deepEqual(result.payload.assetKinds, ["キャラクター"]);
}

console.log("studio-asset-overview-edit ok");
