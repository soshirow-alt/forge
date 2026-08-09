import {
  FORGE_FEATURE_TAG_OPTIONS,
  type ForgeFeatureTagOption,
} from "@/lib/forge-feature-tag-options";
import {
  FORGE_GENRE_OPTIONS,
  type ForgeGenreOption,
} from "@/lib/forge-genre-options";
import {
  isProjectCategoryId,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import {
  getFormalFiltersForCategory,
  parseAllowlistedMulti,
  type FormalFilterFieldId,
  type FormalFilterFieldSpec,
} from "@/lib/project-formal-filter-registry";

/** Legacy hidden Search params — keep in URL when present; do not surface in UI.
 * Ownership registry: `lib/project-formal-filter-ownership.ts`
 * `asset_kind` moved out (2026-08 five-category) — now an active registry-driven
 * filter, rendered generically via `getSearchAttrFilterSpecs`.
 */
export const PLAYER_IA_SEARCH_LEGACY_HIDDEN_PARAMS = [
  "quick_try",
  "usable_for_creation",
  "feedback_wanted",
  "stream_policy",
] as const;

/** Rendered/read from `draft.genres` / `draft.tags` directly, not `attrFilters`. */
const ATTR_PANEL_EXCLUDED_FIELD_IDS = new Set<FormalFilterFieldId>([
  "genre",
  "feature_tag",
]);

/** Registry specs to render/parse generically for a category's Search filters. */
export function getSearchAttrFilterSpecs(
  category: ProjectCategoryId | "all" | null,
): FormalFilterFieldSpec[] {
  return getFormalFiltersForCategory(category).filter(
    (spec) =>
      spec.searchApplicable && !ATTR_PANEL_EXCLUDED_FIELD_IDS.has(spec.fieldId),
  );
}

export const PLAYER_IA_SEARCH_MAX_QUERY_LENGTH = 80;

const GENRE_SET = new Set<string>(FORGE_GENRE_OPTIONS);
const FEATURE_SET = new Set<string>(FORGE_FEATURE_TAG_OPTIONS);

export type PlayerIaSearchFilterDraft = {
  q: string;
  genres: string[];
  tags: string[];
  /** Category-specific formal filters, keyed by `FormalFilterFieldId`.
   *  Only fields applicable to the current category are populated. */
  attrFilters: Record<string, string[]>;
};

function splitCommaList(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

/** Accept comma-separated or repeated URLSearchParams values. */
export function readMultiSearchParam(
  source: URLSearchParams | { getAll?(name: string): string[]; get(name: string): string | null },
  key: string,
): string[] {
  if (typeof (source as URLSearchParams).getAll === "function") {
    const all = (source as URLSearchParams).getAll(key);
    if (all.length > 1) {
      return all
        .flatMap((value) => splitCommaList(value))
        .filter(Boolean);
    }
    if (all.length === 1) {
      return splitCommaList(all[0]);
    }
  }
  return splitCommaList(source.get(key));
}

export function parseGenreFilterValues(values: string[]): ForgeGenreOption[] {
  const unique: ForgeGenreOption[] = [];
  for (const value of values) {
    if (!GENRE_SET.has(value)) continue;
    if (unique.includes(value as ForgeGenreOption)) continue;
    unique.push(value as ForgeGenreOption);
  }
  return unique;
}

export function parseFeatureTagFilterValues(
  values: string[],
): ForgeFeatureTagOption[] {
  const unique: ForgeFeatureTagOption[] = [];
  for (const value of values) {
    if (!FEATURE_SET.has(value)) continue;
    if (unique.includes(value as ForgeFeatureTagOption)) continue;
    unique.push(value as ForgeFeatureTagOption);
  }
  return unique;
}

export function sanitizeSearchQuery(raw: string | null | undefined): string {
  const trimmed = (raw ?? "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  return trimmed.slice(0, PLAYER_IA_SEARCH_MAX_QUERY_LENGTH);
}

/** Category-specific formal filters from URL params (UI-facing values, e.g.
 *  play_environment stays PC/スマホ/ブラウザ — storage-tag mapping happens
 *  only at the RPC layer in `catalog-search-params.ts`). */
export function readAttrFiltersFromParams(
  searchParams: URLSearchParams,
  category: ProjectCategoryId | "all" | null,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const spec of getSearchAttrFilterSpecs(category)) {
    const raw = readMultiSearchParam(searchParams, spec.urlKey);
    const values = parseAllowlistedMulti(
      raw,
      spec.options.map((option) => option.value),
      spec.maxSelection,
    );
    if (values.length > 0) {
      result[spec.fieldId] = values;
    }
  }
  return result;
}

export function readSearchFilterDraftFromParams(
  searchParams: URLSearchParams,
  category?: ProjectCategoryId | "all" | null,
): PlayerIaSearchFilterDraft {
  return {
    q: sanitizeSearchQuery(searchParams.get("q")),
    genres: parseGenreFilterValues(readMultiSearchParam(searchParams, "genre")),
    tags: parseFeatureTagFilterValues(readMultiSearchParam(searchParams, "tag")),
    attrFilters: readAttrFiltersFromParams(searchParams, category ?? null),
  };
}

export function categorySupportsGameFilters(
  category: ProjectCategoryId | "all" | null,
): boolean {
  return category === "game";
}

/**
 * Build /search URL from current params + draft filters.
 * Game-only genre/tag; strips empty; preserves legacy hidden params.
 */
export function buildSearchHrefFromFilters(options: {
  category: ProjectCategoryId | "all" | null;
  sort?: string | null;
  draft: PlayerIaSearchFilterDraft;
  current?: URLSearchParams | null;
}): string {
  const next = new URLSearchParams();
  const current = options.current;

  if (current) {
    for (const key of PLAYER_IA_SEARCH_LEGACY_HIDDEN_PARAMS) {
      const values = current.getAll(key);
      for (const value of values) {
        if (value?.trim()) next.append(key, value);
      }
    }
  }

  const category =
    options.category && options.category !== "all" && isProjectCategoryId(options.category)
      ? options.category
      : null;
  if (category) {
    next.set("category", category);
  }

  const sort = (options.sort ?? current?.get("sort") ?? "").trim();
  if (sort && sort !== "newest") {
    next.set("sort", sort);
  }

  const q = sanitizeSearchQuery(options.draft.q);
  if (q) {
    next.set("q", q);
  }

  if (categorySupportsGameFilters(category)) {
    const genres = parseGenreFilterValues(options.draft.genres);
    const tags = parseFeatureTagFilterValues(options.draft.tags);
    if (genres.length > 0) {
      next.set("genre", genres.join(","));
    }
    if (tags.length > 0) {
      next.set("tag", tags.join(","));
    }
  }

  const attrFilters = options.draft.attrFilters ?? {};
  for (const spec of getSearchAttrFilterSpecs(category)) {
    const raw = attrFilters[spec.fieldId];
    if (!raw || raw.length === 0) continue;
    const values = parseAllowlistedMulti(
      raw,
      spec.options.map((option) => option.value),
      spec.maxSelection,
    );
    if (values.length > 0) {
      next.set(spec.urlKey, values.join(","));
    }
  }

  const query = next.toString();
  return query ? `/search?${query}` : "/search";
}

export function emptySearchFilterDraft(): PlayerIaSearchFilterDraft {
  return { q: "", genres: [], tags: [], attrFilters: {} };
}
