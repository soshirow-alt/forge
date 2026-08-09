/**
 * Studio left-preview chrome by category — shared by submit/edit previews + verifies.
 */
import {
  PROJECT_CATEGORY_LABELS,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import { isStudioCommonFieldsOnlyCategory } from "@/lib/studio-category-mode";
import type { StudioPreviewEditTarget } from "@/lib/studio-preview-edit-targets";

export type StudioPreviewPrototypeInfoCard = {
  title: string;
  rows: { label: string; value: string }[];
};

export type StudioPreviewCategoryChrome = {
  commonFieldsOnly: boolean;
  /** Non-editable category pill (asset). Null → use genre/tag edit chrome. */
  categoryPillLabel: string | null;
  showGenreEditTarget: boolean;
  showPlayAccessEditTarget: boolean;
  showUnsetPlayPlaceholders: boolean;
  /**
   * Game play-info sidebar card (想定時間 / 対応端末 / 遊び方).
   * false → hide section entirely (pass prototypeInfoCard={null}).
   */
  showGamePlayInfoCard: boolean;
  /** Edit targets that must not appear / must be ignored for this chrome. */
  blockedEditTargets: readonly StudioPreviewEditTarget[];
};

const ASSET_BLOCKED: readonly StudioPreviewEditTarget[] = [
  "genres",
  "play-access",
  "play-info",
  "distribution",
];

export function resolveStudioPreviewCategoryChrome(input: {
  category?: string | null;
  commonFieldsOnly?: boolean;
}): StudioPreviewCategoryChrome {
  const commonFieldsOnly =
    input.commonFieldsOnly === true ||
    isStudioCommonFieldsOnlyCategory(input.category);

  if (!commonFieldsOnly) {
    return {
      commonFieldsOnly: false,
      categoryPillLabel: null,
      showGenreEditTarget: true,
      showPlayAccessEditTarget: true,
      showUnsetPlayPlaceholders: true,
      showGamePlayInfoCard: true,
      blockedEditTargets: [],
    };
  }

  const id = (input.category ?? "asset") as ProjectCategoryId;
  return {
    commonFieldsOnly: true,
    categoryPillLabel: PROJECT_CATEGORY_LABELS[id] ?? "アセット",
    showGenreEditTarget: false,
    showPlayAccessEditTarget: false,
    showUnsetPlayPlaceholders: false,
    showGamePlayInfoCard: false,
    blockedEditTargets: ASSET_BLOCKED,
  };
}

/**
 * Prop for GameDetailPlayerOverview / OverviewV0Tab.
 * - asset (commonFieldsOnly): pass asset structured card object, or `null` to hide
 *   (never fall back to game play-info chips)
 * - game: `undefined` uses normal game play-info
 * - non-game prototype: pass the prototype card object
 */
export function studioPreviewPlayInfoCardProp(
  chrome: StudioPreviewCategoryChrome,
  prototypeInfoCard?: StudioPreviewPrototypeInfoCard | null,
): StudioPreviewPrototypeInfoCard | null | undefined {
  if (chrome.commonFieldsOnly) {
    return prototypeInfoCard ?? null;
  }
  return prototypeInfoCard;
}
