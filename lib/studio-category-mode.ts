/**
 * Studio category mode helpers.
 * Formal ids live in project-categories.ts — do not invent a parallel list.
 */
import {
  normalizeProjectCategory,
  type ProjectCategoryId,
} from "@/lib/project-categories";

/** Asset: common Studio fields only (no genre/play-info/prototype panels). */
export function isStudioCommonFieldsOnlyCategory(
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
