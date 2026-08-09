/**
 * Studio category mode helpers.
 * Formal ids live in project-categories.ts — do not invent a parallel list.
 */
import {
  normalizeProjectCategory,
  type ProjectCategoryId,
} from "@/lib/project-categories";

/**
 * Asset: no game genre/play-info panels, and not routed through the
 * SubmitPrototypeCategory (music/dev-tool/service-app) flow. This does NOT
 * mean "no category-specific fields" — asset gets its own structured
 * kinds/formats/tastes/tools panel (see `isStudioAssetCategory`).
 */
export function isStudioCommonFieldsOnlyCategory(
  category: string | null | undefined,
): boolean {
  return category === "asset";
}

/**
 * Asset structured attribute panel (kinds / formats / tastes / tools).
 * Same predicate as `isStudioCommonFieldsOnlyCategory` today (asset is the
 * only "common fields only" category) but named for its own call sites so
 * the two concerns can diverge later without a confusing rename.
 */
export function isStudioAssetCategory(
  category: string | null | undefined,
): boolean {
  return category === "asset";
}

export function resolveStudioSubmitProjectCategory(input: {
  prototypeCategoryMapped?: ProjectCategoryId | null;
  projectCategory?: ProjectCategoryId | null;
}): ProjectCategoryId {
  if (input.projectCategory) {
    return normalizeProjectCategory(input.projectCategory);
  }
  if (input.prototypeCategoryMapped) {
    return input.prototypeCategoryMapped;
  }
  return "game";
}
