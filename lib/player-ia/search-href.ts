import {
  isProjectCategoryId,
  type ProjectCategoryId,
} from "@/lib/project-categories";

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
 * `all` / null removes `category`. Empty values are dropped. Keys are not duplicated.
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
