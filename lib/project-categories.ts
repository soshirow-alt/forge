export const PROJECT_CATEGORY_IDS = [
  "game",
  "audio",
  "asset",
  "dev-tool",
  "service-app",
] as const;

export type ProjectCategoryId = (typeof PROJECT_CATEGORY_IDS)[number];

export const PROJECT_CATEGORY_LABELS: Record<ProjectCategoryId, string> = {
  game: "ゲーム",
  audio: "音楽・音声",
  asset: "アセット",
  "dev-tool": "開発ツール",
  "service-app": "サービス・アプリ",
};

export type ProjectCategoryNavId = ProjectCategoryId | "all";

export type ProjectCategoryNavItem = {
  id: ProjectCategoryNavId;
  label: string;
  href: string;
};

export const PROJECT_CATEGORY_NAV: ProjectCategoryNavItem[] = [
  { id: "all", label: "すべて", href: buildSearchCategoryHref(null) },
  ...PROJECT_CATEGORY_IDS.map((id) => ({
    id,
    label: PROJECT_CATEGORY_LABELS[id],
    href: buildSearchCategoryHref(id),
  })),
];

export const ASSET_KIND_IDS = [
  "2d_illustration",
  "character_model",
  "model_3d",
  "background",
  "ui_element",
  "icon",
  "sprite",
  "texture",
  "material",
  "motion",
  "animation",
  "vfx",
  "shader",
  "font",
] as const;

export type AssetKindId = (typeof ASSET_KIND_IDS)[number];

export const ASSET_KIND_LABELS: Record<AssetKindId, string> = {
  "2d_illustration": "2Dイラスト",
  character_model: "キャラクターモデル",
  model_3d: "3Dモデル",
  background: "背景",
  ui_element: "UI素材",
  icon: "アイコン",
  sprite: "スプライト",
  texture: "テクスチャ",
  material: "マテリアル",
  motion: "モーション",
  animation: "アニメーション",
  vfx: "VFX",
  shader: "シェーダー",
  font: "フォント",
};

export const STREAM_POLICY_IDS = [
  "ok",
  "conditional",
  "no",
  "unset",
] as const;

export type StreamPolicyId = (typeof STREAM_POLICY_IDS)[number];

export const STREAM_POLICY_LABELS: Record<StreamPolicyId, string> = {
  ok: "配信OK",
  conditional: "配信条件あり",
  no: "配信不可",
  unset: "",
};

export const ACTIVITY_TAG_IDS = [
  "player",
  "streamer_creator",
  "game_creator",
  "audio_creator",
  "asset_creator",
  "tool_developer",
  "service_app_developer",
] as const;

export type ActivityTagId = (typeof ACTIVITY_TAG_IDS)[number];

export const ACTIVITY_TAG_LABELS: Record<ActivityTagId, string> = {
  player: "プレイヤー",
  streamer_creator: "配信者・動画制作者",
  game_creator: "ゲーム制作者",
  audio_creator: "音楽・音声制作者",
  asset_creator: "アセット制作者",
  tool_developer: "ツール開発者",
  service_app_developer: "サービス・アプリ開発者",
};

export type CategoryAttributes = {
  assetKinds?: AssetKindId[];
  streamPolicy?: StreamPolicyId;
  streamPolicyNote?: string;
  quickTry?: boolean;
  usableForCreation?: boolean;
  purposeTags?: string[];
};

export function isProjectCategoryId(
  value: string | null | undefined,
): value is ProjectCategoryId {
  return (
    typeof value === "string" &&
    (PROJECT_CATEGORY_IDS as readonly string[]).includes(value)
  );
}

export function normalizeProjectCategory(
  value: string | null | undefined,
): ProjectCategoryId {
  if (isProjectCategoryId(value)) {
    return value;
  }
  return "game";
}

export function buildSearchCategoryHref(
  category: ProjectCategoryId | "all" | null,
): string {
  if (!category || category === "all") {
    return "/search";
  }
  return `/search?category=${category}`;
}

function isAssetKindId(value: unknown): value is AssetKindId {
  return (
    typeof value === "string" &&
    (ASSET_KIND_IDS as readonly string[]).includes(value)
  );
}

function isStreamPolicyId(value: unknown): value is StreamPolicyId {
  return (
    typeof value === "string" &&
    (STREAM_POLICY_IDS as readonly string[]).includes(value)
  );
}

export function emptyCategoryAttributes(): CategoryAttributes {
  return {};
}

export function parseCategoryAttributes(raw: unknown): CategoryAttributes {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return emptyCategoryAttributes();
  }

  const record = raw as Record<string, unknown>;
  const attributes: CategoryAttributes = {};

  if (Array.isArray(record.assetKinds)) {
    const assetKinds = record.assetKinds.filter(isAssetKindId);
    if (assetKinds.length > 0) {
      attributes.assetKinds = assetKinds;
    }
  }

  if (isStreamPolicyId(record.streamPolicy) && record.streamPolicy !== "unset") {
    attributes.streamPolicy = record.streamPolicy;
  }

  if (typeof record.streamPolicyNote === "string") {
    const streamPolicyNote = record.streamPolicyNote.trim();
    if (streamPolicyNote) {
      attributes.streamPolicyNote = streamPolicyNote;
    }
  }

  if (typeof record.quickTry === "boolean") {
    attributes.quickTry = record.quickTry;
  }

  if (typeof record.usableForCreation === "boolean") {
    attributes.usableForCreation = record.usableForCreation;
  }

  if (Array.isArray(record.purposeTags)) {
    const purposeTags = record.purposeTags
      .filter((tag): tag is string => typeof tag === "string")
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (purposeTags.length > 0) {
      attributes.purposeTags = purposeTags;
    }
  }

  return attributes;
}
