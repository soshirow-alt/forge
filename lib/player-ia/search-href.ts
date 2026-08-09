import {
  isProjectCategoryId,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import { PROJECT_FORMAL_FILTER_REGISTRY } from "@/lib/project-formal-filter-registry";
import { getSearchAttrFilterSpecs } from "@/lib/player-ia/search-filter-state";

type SearchParamsLike =
  | URLSearchParams
  | { toString(): string }
  | string
  | null
  | undefined;

function toURLSearchParams(current: SearchParamsLike): URLSearchParams {
  if (!current) {
    return new URLSearchParams();
  }
  if (typeof current === "string") {
    const trimmed = current.startsWith("?") ? current.slice(1) : current;
    return new URLSearchParams(trimmed);
  }
  return new URLSearchParams(current.toString());
}

/**
 * Build `/search` href, replacing only `category` while preserving other params.
 * Leaving game (or selecting all) drops game-only `genre` / `tag`.
 * Legacy hidden filter params are preserved when present.
 */
export function buildSearchHrefForCategory(
  category: ProjectCategoryId | "all" | null,
  current?: SearchParamsLike,
): string {
  const next = toURLSearchParams(current);

  for (const key of [...next.keys()]) {
    const value = next.get(key);
    if (value == null || value.trim() === "") {
      next.delete(key);
    }
  }

  const nextIsGame = category === "game";
  if (!nextIsGame) {
    next.delete("genre");
    next.delete("tag");
  }

  // Category-specific formal filters (registry `urlKey`s) don't carry over
  // across categories — e.g. leaving "asset" drops `format`/`taste`/`tool`.
  // Legacy hidden params (quick_try / stream_policy / ...) aren't in the
  // registry, so they're untouched and preserved regardless of category.
  const allowedAttrUrlKeys = new Set(
    getSearchAttrFilterSpecs(category).map((spec) => spec.urlKey),
  );
  for (const spec of PROJECT_FORMAL_FILTER_REGISTRY) {
    if (spec.fieldId === "genre" || spec.fieldId === "feature_tag") continue;
    if (!spec.searchApplicable) continue;
    if (!allowedAttrUrlKeys.has(spec.urlKey)) {
      next.delete(spec.urlKey);
    }
  }

  if (!category || category === "all") {
    next.delete("category");
  } else if (isProjectCategoryId(category)) {
    next.set("category", category);
  } else {
    next.delete("category");
  }

  const query = next.toString();
  return query ? `/search?${query}` : "/search";
}
