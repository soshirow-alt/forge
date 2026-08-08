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

/** Keys stored in projects.category_attributes for Studio non-game round-trip. */
export type StudioStoredCategoryAttributes = {
  kind?: string;
  musicGenres?: string[];
  musicDuration?: string;
  toolEnvironments?: string[];
  toolUsageMethod?: string;
  serviceEnvironments?: string[];
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
  const musicGenres = asStringArray(record.musicGenres);
  if (musicGenres.length > 0) attrs.musicGenres = musicGenres;
  if (typeof record.musicDuration === "string" && record.musicDuration.trim()) {
    attrs.musicDuration = record.musicDuration.trim();
  }
  const toolEnvironments = asStringArray(record.toolEnvironments);
  if (toolEnvironments.length > 0) attrs.toolEnvironments = toolEnvironments;
  if (
    typeof record.toolUsageMethod === "string" &&
    record.toolUsageMethod.trim()
  ) {
    attrs.toolUsageMethod = record.toolUsageMethod.trim();
  }
  const serviceEnvironments = asStringArray(record.serviceEnvironments);
  if (serviceEnvironments.length > 0) {
    attrs.serviceEnvironments = serviceEnvironments;
  }
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
  if (fields.kind.trim()) attrs.kind = fields.kind.trim();
  if (fields.musicGenres.length > 0) {
    attrs.musicGenres = [...fields.musicGenres];
  }
  if (fields.musicDuration.trim()) {
    attrs.musicDuration = fields.musicDuration.trim();
  }
  if (fields.toolEnvironments.length > 0) {
    attrs.toolEnvironments = [...fields.toolEnvironments];
  }
  if (fields.toolUsageMethod.trim()) {
    attrs.toolUsageMethod = fields.toolUsageMethod.trim();
  }
  if (fields.serviceEnvironments.length > 0) {
    attrs.serviceEnvironments = [...fields.serviceEnvironments];
  }
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

export function decodeCategoryAttributesToPrototypeFields(
  raw: unknown,
): SubmitPrototypeCategoryFields {
  const attrs = parseStudioStoredCategoryAttributes(raw);
  const base = createEmptySubmitPrototypeCategoryFields();
  return {
    ...base,
    kind: attrs.kind ?? "",
    musicGenres: attrs.musicGenres ?? [],
    musicDuration: attrs.musicDuration ?? "",
    toolEnvironments: attrs.toolEnvironments ?? [],
    toolUsageMethod: attrs.toolUsageMethod ?? "",
    serviceEnvironments: attrs.serviceEnvironments ?? [],
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

/** Merge Studio non-game attrs into existing jsonb without dropping unrelated keys. */
export function mergeCategoryAttributesJson(
  existing: unknown,
  studioAttrs: StudioStoredCategoryAttributes,
): Record<string, unknown> {
  const base: Record<string, unknown> =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};

  const keys: (keyof StudioStoredCategoryAttributes)[] = [
    "kind",
    "musicGenres",
    "musicDuration",
    "toolEnvironments",
    "toolUsageMethod",
    "serviceEnvironments",
    "nonGamePublishDestinations",
  ];
  for (const key of keys) {
    delete base[key];
  }

  if (studioAttrs.kind) base.kind = studioAttrs.kind;
  if (studioAttrs.musicGenres?.length) base.musicGenres = studioAttrs.musicGenres;
  if (studioAttrs.musicDuration) base.musicDuration = studioAttrs.musicDuration;
  if (studioAttrs.toolEnvironments?.length) {
    base.toolEnvironments = studioAttrs.toolEnvironments;
  }
  if (studioAttrs.toolUsageMethod) {
    base.toolUsageMethod = studioAttrs.toolUsageMethod;
  }
  if (studioAttrs.serviceEnvironments?.length) {
    base.serviceEnvironments = studioAttrs.serviceEnvironments;
  }
  if (studioAttrs.nonGamePublishDestinations?.length) {
    base.nonGamePublishDestinations = studioAttrs.nonGamePublishDestinations;
  }

  return base;
}
