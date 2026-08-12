/**
 * Public project detail chrome by category — category-neutral CTAs / info cards.
 * Game keeps existing play semantics; non-game never shows プレイ/遊ぶ labels.
 */

import {
  PROJECT_CATEGORY_LABELS,
  PROJECT_CATEGORY_SELECTOR_LABELS,
  normalizeProjectCategory,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import type { Game } from "@/lib/mock-games";
import {
  decodeCategoryAttributesToAssetFields,
  decodeCategoryAttributesToPrototypeFields,
  projectCategoryToPrototypeCategory,
  type SubmitAssetCategoryFields,
} from "@/lib/studio-non-game-attributes";
import {
  SUBMIT_PROTOTYPE_PRIMARY_CTA,
  SUBMIT_PROTOTYPE_USAGE_PANEL_TITLE,
  type SubmitPrototypeCategory,
  type SubmitPrototypeCategoryFields,
} from "@/lib/prototype/studio-submit-flow";
import { getPrimaryPlayCtaLabel } from "@/lib/game-player-display";

export type ProjectDetailInfoCard = {
  title: string;
  rows: { label: string; value: string }[];
};

/** Lucide icon keys for primary CTA — keep set small; mapped in detail UI. */
export type ProjectDetailPrimaryCtaIcon =
  | "play"
  | "headphones"
  | "eye"
  | "wrench"
  | "external-link";

export type ProjectDetailCategoryChrome = {
  category: ProjectCategoryId;
  /** Primary CTA label (play / listen / open tool / …). */
  primaryCtaLabel: string;
  /** Icon hint for primary CTA (game keeps Play; non-game avoids play glyph). */
  primaryCtaIcon: ProjectDetailPrimaryCtaIcon;
  feedbackCtaLabelLoggedIn: string;
  feedbackCtaLabelGuest: string;
  saveButtonLabel: string;
  saveButtonLabelOn: string;
  followCreatorLabel: string;
  followCreatorLabelOn: string;
  /** null = hide info card; undefined = use game play-info path. */
  infoCard: ProjectDetailInfoCard | null | undefined;
  showGamePlayInfo: boolean;
  categoryChipLabel: string;
};

function joinOrEmpty(values: string[]): string {
  return values.map((v) => v.trim()).filter(Boolean).join("、");
}

function buildPrototypeInfoCard(
  category: SubmitPrototypeCategory,
  fields: SubmitPrototypeCategoryFields,
): ProjectDetailInfoCard {
  const title =
    category === "music"
      ? "音源情報"
      : category === "dev_tool"
        ? "ツール情報"
        : "サービス情報";
  // Prefer category-specific titles over Studio panel titles that say 利用情報.
  void SUBMIT_PROTOTYPE_USAGE_PANEL_TITLE;
  const rows: { label: string; value: string }[] = [];

  if (category === "music") {
    const kinds = joinOrEmpty(
      fields.kinds.length > 0 ? fields.kinds : filterFalsy([fields.kind]),
    );
    if (kinds) rows.push({ label: "種類", value: kinds });
    const genres = joinOrEmpty(fields.musicGenres);
    if (genres) rows.push({ label: "音楽ジャンル", value: genres });
    const duration = fields.musicDuration.trim();
    if (duration) rows.push({ label: "再生時間", value: duration });
    const moods = joinOrEmpty(fields.moods);
    if (moods) rows.push({ label: "雰囲気", value: moods });
    const purposes = joinOrEmpty(fields.purposes);
    if (purposes) rows.push({ label: "用途", value: purposes });
  } else if (category === "dev_tool") {
    const kinds = joinOrEmpty(
      fields.kinds.length > 0 ? fields.kinds : filterFalsy([fields.kind]),
    );
    if (kinds) rows.push({ label: "種類", value: kinds });
    const envs = joinOrEmpty(fields.toolEnvironments);
    if (envs) rows.push({ label: "対応環境", value: envs });
    const usage = fields.toolUsageMethod.trim();
    if (usage) rows.push({ label: "利用方法", value: usage });
    const features = joinOrEmpty(fields.features);
    if (features) rows.push({ label: "特徴", value: features });
  } else {
    const kinds = joinOrEmpty(
      fields.kinds.length > 0 ? fields.kinds : filterFalsy([fields.kind]),
    );
    if (kinds) rows.push({ label: "種類", value: kinds });
    const purposes = joinOrEmpty(fields.purposes);
    if (purposes) rows.push({ label: "用途", value: purposes });
    const envs = joinOrEmpty(fields.serviceEnvironments);
    if (envs) rows.push({ label: "対応環境", value: envs });
    const features = joinOrEmpty(fields.features);
    if (features) rows.push({ label: "特徴", value: features });
  }

  return { title, rows };
}

function filterFalsy(values: (string | undefined)[]): string[] {
  return values
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
}

function buildAssetInfoCard(
  fields: SubmitAssetCategoryFields,
): ProjectDetailInfoCard | null {
  const rows: { label: string; value: string }[] = [];
  const kinds = joinOrEmpty(fields.kinds);
  if (kinds) rows.push({ label: "アセット種別", value: kinds });
  const formats = joinOrEmpty(fields.formats);
  if (formats) rows.push({ label: "表現形式", value: formats });
  const tastes = joinOrEmpty(fields.tastes);
  if (tastes) rows.push({ label: "テイスト", value: tastes });
  const tools = joinOrEmpty(fields.tools);
  if (tools) rows.push({ label: "対応ツール", value: tools });
  if (rows.length === 0) return null;
  return { title: "素材情報", rows };
}

const NON_GAME_PRIMARY: Record<
  Exclude<ProjectCategoryId, "game">,
  string
> = {
  audio: "聴く",
  asset: "アセットを見る",
  "dev-tool": "ツールを見る",
  "service-app": "サービスを見る",
};

const NON_GAME_PRIMARY_ICON: Record<
  Exclude<ProjectCategoryId, "game">,
  ProjectDetailPrimaryCtaIcon
> = {
  audio: "headphones",
  asset: "eye",
  "dev-tool": "wrench",
  "service-app": "external-link",
};

const NON_GAME_FEEDBACK: Record<
  Exclude<ProjectCategoryId, "game">,
  string
> = {
  audio: "聴いたあとにフィードバックする",
  asset: "確認したあとにフィードバックする",
  "dev-tool": "使ってフィードバックする",
  "service-app": "使ってフィードバックする",
};

/**
 * Resolve public detail chrome for a project.
 * Pass `game` when available so CTAs/info cards use live destinations + attributes.
 */
export function resolveProjectDetailCategoryChrome(input: {
  category?: string | null;
  game?: Game | null;
}): ProjectDetailCategoryChrome {
  const category = normalizeProjectCategory(input.category ?? input.game?.category);
  const game = input.game ?? null;
  const chip =
    PROJECT_CATEGORY_SELECTOR_LABELS[category] ??
    PROJECT_CATEGORY_LABELS[category] ??
    category;

  if (category === "game") {
    return {
      category,
      primaryCtaLabel: game ? getPrimaryPlayCtaLabel(game) : "プレイする",
      primaryCtaIcon: "play",
      feedbackCtaLabelLoggedIn: "フィードバックする",
      feedbackCtaLabelGuest: "ログインしてフィードバックする",
      saveButtonLabel: "あとで遊ぶ",
      saveButtonLabelOn: "保存済み",
      followCreatorLabel: "クリエイターをフォロー",
      followCreatorLabelOn: "クリエイターフォロー中",
      infoCard: undefined,
      showGamePlayInfo: true,
      categoryChipLabel: chip,
    };
  }

  const proto = projectCategoryToPrototypeCategory(category);
  let infoCard: ProjectDetailInfoCard | null = null;
  let primaryFromStudio: string | undefined;

  if (category === "asset") {
    const assetFields = decodeCategoryAttributesToAssetFields(
      game?.categoryAttributes,
      game?.assetKinds,
    );
    infoCard = buildAssetInfoCard(assetFields);
    primaryFromStudio = "アセットを見る";
  } else if (proto) {
    const fields = decodeCategoryAttributesToPrototypeFields(
      game?.categoryAttributes,
    );
    const card = buildPrototypeInfoCard(proto, fields);
    infoCard = card.rows.length > 0 ? card : null;
    primaryFromStudio = SUBMIT_PROTOTYPE_PRIMARY_CTA[proto];
  }

  return {
    category,
    primaryCtaLabel:
      primaryFromStudio ?? NON_GAME_PRIMARY[category] ?? "見る",
    primaryCtaIcon: NON_GAME_PRIMARY_ICON[category] ?? "eye",
    feedbackCtaLabelLoggedIn:
      NON_GAME_FEEDBACK[category] ?? "試したあとにフィードバックする",
    feedbackCtaLabelGuest: "ログインしてフィードバックする",
    saveButtonLabel: "あとで見る",
    saveButtonLabelOn: "保存済み",
    followCreatorLabel: "クリエイターをフォロー",
    followCreatorLabelOn: "クリエイターフォロー中",
    infoCard,
    showGamePlayInfo: false,
    categoryChipLabel: chip,
  };
}

/** True when a release_status / playable badge should use game "playable" wording. */
export function shouldShowPlayableBadge(category?: string | null): boolean {
  return normalizeProjectCategory(category) === "game";
}
