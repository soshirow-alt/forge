import {
  isProjectCategoryId,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import { PLAYER_IA_SEARCH_LEGACY_HIDDEN_PARAMS } from "@/lib/player-ia/search-filter-state";

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

  if (!category || category === "all") {
    next.delete("category");
  } else if (isProjectCategoryId(category)) {
    next.set("category", category);
  } else {
    next.delete("category");
  }

  // Ensure we didn't accidentally drop legacy keys when cleaning empties
  void PLAYER_IA_SEARCH_LEGACY_HIDDEN_PARAMS;

  const query = next.toString();
  return query ? `/search?${query}` : "/search";
}
