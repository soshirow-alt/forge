/**
 * Map existing non-game Studio UI fields ↔ projects.category_attributes / publish_destinations.
 * No new input fields — encode/decode only.
 */

import {
  normalizeProjectCategory,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import {
  createEmptyPublishDestination,
  type PublishDestination,
  type PublishDestinationKind,
} from "@/lib/project-publish-links";
import {
  createEmptySubmitPrototypeCategoryFields,
  SUBMIT_PROTOTYPE_PUBLISH_KINDS,
  type PrototypePublishDestination,
  type SubmitPrototypeCategory,
  type SubmitPrototypeCategoryFields,
} from "@/lib/prototype/studio-submit-flow";
import {
  audioKindsShowMusicGenres,
  canonicalizeLegacyValues,
  normalizeFormalMultiForSave,
  type FormalFilterFieldId,
  type FormalMultiNormalizeResult,
  type LegacyAliasStorageKey,
} from "@/lib/project-formal-filter-registry";

/**
 * Keys stored in projects.category_attributes for Studio non-game + asset round-trip.
 *
 * `kinds` is canonical for audio / dev-tool / service-app (multi, registry-driven).
 * `kind` (singular) is a legacy READ FALLBACK only — new writes never dual-write both.
 * Asset does not use `kinds` here (written to the dedicated `projects.asset_kinds`
 * column instead) — it uses `formats` / `tastes` / `tools` from this same jsonb shape.
 */
export type StudioStoredCategoryAttributes = {
  /** @deprecated legacy singular — read fallback only. New writes use `kinds`. */
  kind?: string;
  /** Canonical multi-select kinds (audio / dev-tool / service-app). */
  kinds?: string[];
  musicGenres?: string[];
  musicDuration?: string;
  /** Audio: 雰囲気 */
  moods?: string[];
  /** Audio + service-app: 用途 */
  purposes?: string[];
  /** Asset: 表現形式 */
  formats?: string[];
  /** Asset: テイスト */
  tastes?: string[];
  /** Asset + dev-tool 利用ツール（helper text distinguishes usage per category） */
  tools?: string[];
  toolEnvironments?: string[];
  toolUsageMethod?: string;
  serviceEnvironments?: string[];
  /** dev-tool + service-app: 特徴 — never written to projects.tags */
  features?: string[];
  /** Source-of-truth labels/kinds from prototype publication UI. */
  nonGamePublishDestinations?: PrototypePublishDestination[];
};

const PROTO_KIND_TO_FORMAL: Record<string, PublishDestinationKind> = {
  BOOTH: "booth",
  "Google Drive": "google_drive",
  "GitHub Releases": "github_releases",
  "App Store": "app_store",
  "Google Play": "google_play",
  自サイト: "self_site",
  その他: "other",
  ブラウザ版: "other",
  Webサービス: "other",
  YouTube: "other",
  SoundCloud: "other",
  Bandcamp: "other",
  Spotify: "other",
  "Apple Music": "other",
  GitHubリポジトリ: "github_releases",
  npm: "other",
  PyPI: "other",
  "Unity Asset Store": "other",
  拡張機能ストア: "other",
  ブラウザ拡張機能ストア: "other",
  "Discord等の追加・招待先": "other",
};

export function prototypeCategoryToProjectCategory(
  category: SubmitPrototypeCategory,
): ProjectCategoryId {
  if (category === "music") return "audio";
  if (category === "dev_tool") return "dev-tool";
  return "service-app";
}

export function projectCategoryToPrototypeCategory(
  category: ProjectCategoryId | null | undefined,
): SubmitPrototypeCategory | null {
  const normalized = category ? normalizeProjectCategory(category) : null;
  if (normalized === "audio") return "music";
  if (normalized === "dev-tool") return "dev_tool";
  if (normalized === "service-app") return "web_service";
  return null;
}

export function isNonGameStudioCategory(
  category: ProjectCategoryId | null | undefined,
): boolean {
  return projectCategoryToPrototypeCategory(category) != null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePrototypePublishDestinations(
  raw: unknown,
): PrototypePublishDestination[] {
  if (!Array.isArray(raw)) return [];
  const out: PrototypePublishDestination[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const record = item as Record<string, unknown>;
    const id = typeof record.id === "string" ? record.id.trim() : "";
    const kind = typeof record.kind === "string" ? record.kind.trim() : "";
    const url = typeof record.url === "string" ? record.url.trim() : "";
    if (!id) continue;
    out.push({
      id,
      kind,
      url,
      isPrimary: record.isPrimary === true,
    });
  }
  return out;
}

/** Legacy combined audio kind — split for edit-hydration when found alone. */
const LEGACY_AUDIO_KIND_SFX_JINGLE = "効果音・ジングル";
const LEGACY_AUDIO_KIND_SFX_JINGLE_SPLIT = ["効果音・SE", "ジングル"];

/** Kinds hydration: canonical array wins; else fall back to legacy singular. */
function hydrateKinds(kinds: string[], legacyKind: string | undefined): string[] {
  if (kinds.length > 0) return kinds;
  if (!legacyKind) return [];
  if (legacyKind === LEGACY_AUDIO_KIND_SFX_JINGLE) {
    return [...LEGACY_AUDIO_KIND_SFX_JINGLE_SPLIT];
  }
  return [legacyKind];
}

export function parseStudioStoredCategoryAttributes(
  raw: unknown,
): StudioStoredCategoryAttributes {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const record = raw as Record<string, unknown>;
  const attrs: StudioStoredCategoryAttributes = {};

  if (typeof record.kind === "string" && record.kind.trim()) {
    attrs.kind = record.kind.trim();
  }
  const kinds = canonicalizeLegacyValues(
    "kinds",
    hydrateKinds(asStringArray(record.kinds), attrs.kind),
  );
  if (kinds.length > 0) attrs.kinds = kinds;
  const musicGenres = asStringArray(record.musicGenres);
  if (musicGenres.length > 0) attrs.musicGenres = musicGenres;
  if (typeof record.musicDuration === "string" && record.musicDuration.trim()) {
    attrs.musicDuration = record.musicDuration.trim();
  }
  const moods = asStringArray(record.moods);
  if (moods.length > 0) attrs.moods = moods;
  const purposes = asStringArray(record.purposes);
  if (purposes.length > 0) attrs.purposes = purposes;
  const formats = asStringArray(record.formats);
  if (formats.length > 0) attrs.formats = formats;
  const tastes = asStringArray(record.tastes);
  if (tastes.length > 0) attrs.tastes = tastes;
  const tools = asStringArray(record.tools);
  if (tools.length > 0) attrs.tools = tools;
  const toolEnvironments = canonicalizeLegacyValues(
    "toolEnvironments",
    asStringArray(record.toolEnvironments),
  );
  if (toolEnvironments.length > 0) attrs.toolEnvironments = toolEnvironments;
  if (
    typeof record.toolUsageMethod === "string" &&
    record.toolUsageMethod.trim()
  ) {
    attrs.toolUsageMethod = record.toolUsageMethod.trim();
  }
  const serviceEnvironments = canonicalizeLegacyValues(
    "serviceEnvironments",
    asStringArray(record.serviceEnvironments),
  );
  if (serviceEnvironments.length > 0) {
    attrs.serviceEnvironments = serviceEnvironments;
  }
  const features = asStringArray(record.features);
  if (features.length > 0) attrs.features = features;
  const pubs = parsePrototypePublishDestinations(
    record.nonGamePublishDestinations,
  );
  if (pubs.length > 0) attrs.nonGamePublishDestinations = pubs;

  return attrs;
}

export function encodePrototypeFieldsToCategoryAttributes(
  fields: SubmitPrototypeCategoryFields,
): StudioStoredCategoryAttributes {
  const attrs: StudioStoredCategoryAttributes = {};
  // Canonical multi-select — new writes never dual-write legacy singular `kind`.
  const kinds = fields.kinds.length > 0 ? fields.kinds : filterFalsy([fields.kind]);
  if (kinds.length > 0) attrs.kinds = [...kinds];
  if (audioKindsShowMusicGenres(kinds) && fields.musicGenres.length > 0) {
    attrs.musicGenres = [...fields.musicGenres];
  }
  if (fields.musicDuration.trim()) {
    attrs.musicDuration = fields.musicDuration.trim();
  }
  if (fields.moods.length > 0) attrs.moods = [...fields.moods];
  if (fields.purposes.length > 0) attrs.purposes = [...fields.purposes];
  if (fields.toolEnvironments.length > 0) {
    attrs.toolEnvironments = [...fields.toolEnvironments];
  }
  if (fields.toolUsageMethod.trim()) {
    attrs.toolUsageMethod = fields.toolUsageMethod.trim();
  }
  if (fields.serviceEnvironments.length > 0) {
    attrs.serviceEnvironments = [...fields.serviceEnvironments];
  }
  if (fields.features.length > 0) attrs.features = [...fields.features];
  const pubs = fields.publishDestinations.filter(
    (item) => item.url.trim() || item.kind.trim(),
  );
  if (pubs.length > 0) {
    attrs.nonGamePublishDestinations = pubs.map((item) => ({
      id: item.id,
      kind: item.kind.trim(),
      url: item.url.trim(),
      isPrimary: item.isPrimary,
    }));
  }
  return attrs;
}

function filterFalsy(values: (string | undefined)[]): string[] {
  return values
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
}

export type NonGamePrototypeSanitizeResult =
  | { ok: true; fields: SubmitPrototypeCategoryFields }
  | { ok: false; message: string };

const NO_VALUES_RESULT: FormalMultiNormalizeResult = { ok: true, values: [] };

/**
 * Save-boundary normalize for non-game prototype fields — preserve+reject,
 * NOT silent-drop:
 * - canonical/allowlisted values always pass
 * - values already present in `baseline` (the pre-edit hydrated state, e.g.
 *   `decodeCategoryAttributesToPrototypeFields(game.categoryAttributes)`)
 *   are preserved even if no longer allowlisted — saving one section (or
 *   re-saving with no change) must never silently erase a legacy/obsolete
 *   value living in an untouched field
 * - any other unknown value (new, tampered, never persisted before) is
 *   rejected with an explicit validation error instead of being silently
 *   stripped
 *
 * `baseline` omitted/null (create/submit — nothing persisted yet) means
 * only allowlisted values pass; any unknown value is rejected.
 */
export function sanitizeNonGamePrototypeFieldsForSave(
  category: SubmitPrototypeCategory,
  fields: SubmitPrototypeCategoryFields,
  baseline?: SubmitPrototypeCategoryFields | null,
): NonGamePrototypeSanitizeResult {
  const kindFieldId: FormalFilterFieldId =
    category === "music"
      ? "audio_kinds"
      : category === "dev_tool"
        ? "dev_tool_kinds"
        : "service_kinds";
  // kinds legacy alias (service-app スマートフォンアプリ→スマホアプリ) only applies to
  // service_kinds — audio/dev-tool kinds have no LEGACY_VALUE_ALIASES entry.
  const kindsLegacyKey: LegacyAliasStorageKey | undefined =
    category === "web_service" ? "kinds" : undefined;

  const kindsResult = normalizeFormalMultiForSave({
    next: fields.kinds.length > 0 ? fields.kinds : filterFalsy([fields.kind]),
    baseline: baseline
      ? baseline.kinds.length > 0
        ? baseline.kinds
        : filterFalsy([baseline.kind])
      : undefined,
    fieldId: kindFieldId,
    legacyKey: kindsLegacyKey,
  });
  if (!kindsResult.ok) return kindsResult;

  const musicGenresResult =
    category === "music"
      ? normalizeFormalMultiForSave({
          next: fields.musicGenres,
          baseline: baseline?.musicGenres,
          fieldId: "music_genres",
        })
      : NO_VALUES_RESULT;
  if (!musicGenresResult.ok) return musicGenresResult;

  const moodsResult =
    category === "music"
      ? normalizeFormalMultiForSave({
          next: fields.moods,
          baseline: baseline?.moods,
          fieldId: "audio_moods",
        })
      : NO_VALUES_RESULT;
  if (!moodsResult.ok) return moodsResult;

  const purposesResult =
    category === "music"
      ? normalizeFormalMultiForSave({
          next: fields.purposes,
          baseline: baseline?.purposes,
          fieldId: "audio_purposes",
        })
      : category === "web_service"
        ? normalizeFormalMultiForSave({
            next: fields.purposes,
            baseline: baseline?.purposes,
            fieldId: "service_purposes",
          })
        : NO_VALUES_RESULT;
  if (!purposesResult.ok) return purposesResult;

  const toolEnvironmentsResult =
    category === "dev_tool"
      ? normalizeFormalMultiForSave({
          next: fields.toolEnvironments,
          baseline: baseline?.toolEnvironments,
          fieldId: "dev_tool_environments",
          legacyKey: "toolEnvironments",
        })
      : NO_VALUES_RESULT;
  if (!toolEnvironmentsResult.ok) return toolEnvironmentsResult;

  const serviceEnvironmentsResult =
    category === "web_service"
      ? normalizeFormalMultiForSave({
          next: fields.serviceEnvironments,
          baseline: baseline?.serviceEnvironments,
          fieldId: "service_environments",
          legacyKey: "serviceEnvironments",
        })
      : NO_VALUES_RESULT;
  if (!serviceEnvironmentsResult.ok) return serviceEnvironmentsResult;

  const featuresResult =
    category === "dev_tool"
      ? normalizeFormalMultiForSave({
          next: fields.features,
          baseline: baseline?.features,
          fieldId: "dev_tool_features",
        })
      : category === "web_service"
        ? normalizeFormalMultiForSave({
            next: fields.features,
            baseline: baseline?.features,
            fieldId: "service_features",
          })
        : NO_VALUES_RESULT;
  if (!featuresResult.ok) return featuresResult;

  return {
    ok: true,
    fields: {
      ...fields,
      kind: kindsResult.values[0] ?? "",
      kinds: kindsResult.values,
      musicGenres: musicGenresResult.values,
      moods: moodsResult.values,
      purposes: purposesResult.values,
      toolEnvironments: toolEnvironmentsResult.values,
      serviceEnvironments: serviceEnvironmentsResult.values,
      features: featuresResult.values,
    },
  };
}

export function decodeCategoryAttributesToPrototypeFields(
  raw: unknown,
): SubmitPrototypeCategoryFields {
  const attrs = parseStudioStoredCategoryAttributes(raw);
  const base = createEmptySubmitPrototypeCategoryFields();
  const kinds = attrs.kinds ?? [];
  return {
    ...base,
    kind: kinds[0] ?? "",
    kinds,
    musicGenres: attrs.musicGenres ?? [],
    musicDuration: attrs.musicDuration ?? "",
    moods: attrs.moods ?? [],
    purposes: attrs.purposes ?? [],
    toolEnvironments: attrs.toolEnvironments ?? [],
    toolUsageMethod: attrs.toolUsageMethod ?? "",
    serviceEnvironments: attrs.serviceEnvironments ?? [],
    features: attrs.features ?? [],
    publishDestinations:
      attrs.nonGamePublishDestinations &&
      attrs.nonGamePublishDestinations.length > 0
        ? attrs.nonGamePublishDestinations.map((item) => ({ ...item }))
        : base.publishDestinations,
  };
}

export function isAllowedPrototypePublishKind(
  category: SubmitPrototypeCategory,
  kind: string,
): boolean {
  const trimmed = kind.trim();
  if (!trimmed) return false;
  return SUBMIT_PROTOTYPE_PUBLISH_KINDS[category].includes(trimmed);
}

/**
 * Formal mapping 前の公開先検証。
 * URL 空行は未入力として無視。URL ありは kind 必須かつカテゴリ option 正本のみ。
 */
export function validatePrototypePublishDestinationsForCategory(
  category: SubmitPrototypeCategory,
  destinations: PrototypePublishDestination[],
): string | null {
  const allowed = new Set(SUBMIT_PROTOTYPE_PUBLISH_KINDS[category]);
  let configured = 0;

  for (const item of destinations) {
    const url = item.url.trim();
    const kind = item.kind.trim();
    if (!url) {
      continue;
    }
    configured += 1;
    if (!kind) {
      return "公開先の種類を選んでください。";
    }
    if (!allowed.has(kind)) {
      return "公開先の種類を選んでください。";
    }
  }

  if (configured === 0) {
    return "メイン公開先のURLを入力してください。";
  }

  return null;
}

export function mapPrototypePublishToFormal(
  destinations: PrototypePublishDestination[],
): PublishDestination[] {
  const withUrl = destinations.filter((item) => item.url.trim());
  if (withUrl.length === 0) {
    return [];
  }

  const explicitPrimaryIndex = withUrl.findIndex((item) => item.isPrimary);
  const primaryIndex = explicitPrimaryIndex >= 0 ? explicitPrimaryIndex : 0;

  return withUrl.map((item, index) => {
    const kindLabel = item.kind.trim();
    const formalKind = PROTO_KIND_TO_FORMAL[kindLabel];
    if (!formalKind) {
      throw new Error(
        `Unmapped prototype publish kind (validate before map): ${kindLabel}`,
      );
    }
    return createEmptyPublishDestination({
      id: item.id,
      kind: formalKind,
      url: item.url.trim(),
      isPrimary: index === primaryIndex,
      usageMethod:
        formalKind === "self_site" || formalKind === "other" ? "other" : null,
    });
  });
}

type CategoryAttributesKey = keyof StudioStoredCategoryAttributes;

/**
 * Keys owned by the audio / dev-tool / service-app prototype panels (genres-tags
 * + play-info + publication). Asset's `formats` / `tastes` / `tools` are
 * deliberately excluded — those panels never see or write them.
 */
export const NON_GAME_PROTOTYPE_ATTRIBUTE_KEYS: CategoryAttributesKey[] = [
  "kind",
  "kinds",
  "musicGenres",
  "musicDuration",
  "moods",
  "purposes",
  "toolEnvironments",
  "toolUsageMethod",
  "serviceEnvironments",
  "features",
  "nonGamePublishDestinations",
];

/**
 * genres-tags / classification panel ownership — this is the panel
 * (`StudioSubmitPrototypeClassificationEditPanel`) that actually renders and
 * edits 雰囲気/用途/特徴 (moods/purposes/features) alongside 種類/ジャンル, so
 * those keys must live here — not in the usage/play-info set below — or a
 * genres-tags save silently fails to persist them (they get scoped out of
 * the category_attributes merge for that edit mode).
 */
export const NON_GAME_CLASSIFICATION_ATTRIBUTE_KEYS: CategoryAttributesKey[] = [
  "kind",
  "kinds",
  "musicGenres",
  "moods",
  "purposes",
  "features",
];

/**
 * play-info / usage panel ownership — `StudioSubmitPrototypeUsageEditPanel`
 * only renders 再生時間 / 対応環境・利用方法, never moods/purposes/features.
 */
export const NON_GAME_USAGE_ATTRIBUTE_KEYS: CategoryAttributesKey[] = [
  "musicDuration",
  "toolEnvironments",
  "toolUsageMethod",
  "serviceEnvironments",
];

/** publication panel ownership (attrs jsonb publish mirror) */
export const NON_GAME_PUBLICATION_ATTRIBUTE_KEYS: CategoryAttributesKey[] = [
  "nonGamePublishDestinations",
];

/**
 * Keys owned by the Asset structured fields panel. Deliberately excludes
 * kind/kinds/musicGenres/moods/purposes/toolEnvironments/toolUsageMethod/
 * serviceEnvironments/features/nonGamePublishDestinations — Asset never
 * reads or writes those, so saving Asset must not delete them from an
 * existing project's category_attributes.
 */
export const ASSET_ATTRIBUTE_KEYS: CategoryAttributesKey[] = [
  "formats",
  "tastes",
  "tools",
];

function setCategoryAttributeValue(
  base: Record<string, unknown>,
  key: CategoryAttributesKey,
  value: StudioStoredCategoryAttributes[CategoryAttributesKey],
): void {
  if (Array.isArray(value)) {
    if (value.length > 0) base[key] = value;
    return;
  }
  if (typeof value === "string") {
    if (value) base[key] = value;
  }
}

/**
 * Merge Studio non-game/asset attrs into existing jsonb without dropping
 * keys owned by other category panels or unknown/future keys. `ownedKeys`
 * scopes both the delete-before-write and the write to exactly the keys the
 * calling panel owns (defaults to the non-game prototype panel key set —
 * pass `ASSET_ATTRIBUTE_KEYS` when saving the Asset panel).
 */
export function mergeCategoryAttributesJson(
  existing: unknown,
  studioAttrs: StudioStoredCategoryAttributes,
  ownedKeys: readonly CategoryAttributesKey[] = NON_GAME_PROTOTYPE_ATTRIBUTE_KEYS,
): Record<string, unknown> {
  const base: Record<string, unknown> =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};

  for (const key of ownedKeys) {
    delete base[key];
  }
  // `kind` singular is legacy read-fallback only — never dual-written here,
  // so it is deleted above (when owned) but never re-set below.
  for (const key of ownedKeys) {
    if (key === "kind") continue;
    setCategoryAttributeValue(base, key, studioAttrs[key]);
  }

  return base;
}

/** Asset-only structured fields (formats/tastes/tools), independent of prototype flow. */
export type SubmitAssetCategoryFields = {
  /** Canonical labels — written to the dedicated `projects.asset_kinds` column. */
  kinds: string[];
  formats: string[];
  tastes: string[];
  tools: string[];
};

export function createEmptySubmitAssetCategoryFields(): SubmitAssetCategoryFields {
  return { kinds: [], formats: [], tastes: [], tools: [] };
}

export type AssetFieldsSanitizeResult =
  | { ok: true; fields: SubmitAssetCategoryFields }
  | { ok: false; message: string };

/**
 * Save-boundary normalize for Asset structured fields — same preserve+reject
 * rationale as `sanitizeNonGamePrototypeFieldsForSave`. `baseline` should be
 * the pre-edit hydrated fields (e.g. `decodeCategoryAttributesToAssetFields`)
 * so legacy existing values survive an edit to an unrelated chip group;
 * omitted/null (create) means unknown values are rejected outright.
 */
export function sanitizeAssetFieldsForSave(
  fields: SubmitAssetCategoryFields,
  baseline?: SubmitAssetCategoryFields | null,
): AssetFieldsSanitizeResult {
  const kindsResult = normalizeFormalMultiForSave({
    next: fields.kinds,
    baseline: baseline?.kinds,
    fieldId: "asset_kind",
  });
  if (!kindsResult.ok) return kindsResult;
  const formatsResult = normalizeFormalMultiForSave({
    next: fields.formats,
    baseline: baseline?.formats,
    fieldId: "asset_formats",
  });
  if (!formatsResult.ok) return formatsResult;
  const tastesResult = normalizeFormalMultiForSave({
    next: fields.tastes,
    baseline: baseline?.tastes,
    fieldId: "asset_tastes",
  });
  if (!tastesResult.ok) return tastesResult;
  const toolsResult = normalizeFormalMultiForSave({
    next: fields.tools,
    baseline: baseline?.tools,
    fieldId: "asset_tools",
  });
  if (!toolsResult.ok) return toolsResult;
  return {
    ok: true,
    fields: {
      kinds: kindsResult.values,
      formats: formatsResult.values,
      tastes: tastesResult.values,
      tools: toolsResult.values,
    },
  };
}

/** Asset writes formats/tastes/tools to category_attributes; kinds go to asset_kinds column. */
export function encodeAssetFieldsToCategoryAttributes(
  fields: SubmitAssetCategoryFields,
): StudioStoredCategoryAttributes {
  const attrs: StudioStoredCategoryAttributes = {};
  if (fields.formats.length > 0) attrs.formats = [...fields.formats];
  if (fields.tastes.length > 0) attrs.tastes = [...fields.tastes];
  if (fields.tools.length > 0) attrs.tools = [...fields.tools];
  return attrs;
}

export function decodeCategoryAttributesToAssetFields(
  raw: unknown,
  assetKinds?: string[] | null,
): SubmitAssetCategoryFields {
  const attrs = parseStudioStoredCategoryAttributes(raw);
  return {
    kinds: assetKinds ? [...assetKinds] : [],
    formats: attrs.formats ?? [],
    tastes: attrs.tastes ?? [],
    tools: attrs.tools ?? [],
  };
}
