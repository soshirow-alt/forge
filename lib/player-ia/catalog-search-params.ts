import {
  isProjectCategoryId,
  type AssetKindId,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import {
  mapPlayEnvironmentStorageTagToUi,
  mapPlayEnvironmentUiToStorageTag,
  parseAllowlistedMulti,
} from "@/lib/project-formal-filter-registry";
import {
  CATALOG_ATTR_FIELD_TO_PARAM_KEY,
  isAssetKindFilter,
  type CatalogAttrParamKey,
} from "@/lib/supabase/public-catalog-db";
import type { CatalogSearchParams } from "@/lib/supabase/public-catalog-db";
import {
  getSearchAttrFilterSpecs,
  parseFeatureTagFilterValues,
  parseGenreFilterValues,
  readMultiSearchParam,
  sanitizeSearchQuery,
} from "@/lib/player-ia/search-filter-state";

export const PLAYER_IA_SEARCH_CATALOG_LIMIT = 48;

export type CatalogSearchParamSource =
  | URLSearchParams
  | {
      get(name: string): string | null;
      getAll?(name: string): string[];
    }
  | Record<string, string | string[] | undefined>;

function readParam(
  source: CatalogSearchParamSource,
  key: string,
): string | null {
  if (
    source instanceof URLSearchParams ||
    typeof (source as { get?: unknown }).get === "function"
  ) {
    const value = (source as { get(name: string): string | null }).get(key);
    return value == null ? null : value;
  }
  const raw = (source as Record<string, string | string[] | undefined>)[key];
  if (Array.isArray(raw)) {
    return raw[0] ?? null;
  }
  return raw ?? null;
}

function readMulti(
  source: CatalogSearchParamSource,
  key: string,
): string[] {
  if (source instanceof URLSearchParams) {
    return readMultiSearchParam(source, key);
  }
  if (typeof (source as { get?: unknown }).get === "function") {
    return readMultiSearchParam(
      source as {
        getAll?(name: string): string[];
        get(name: string): string | null;
      },
      key,
    );
  }
  const raw = (source as Record<string, string | string[] | undefined>)[key];
  if (Array.isArray(raw)) {
    return raw
      .flatMap((value) => value.split(",").map((part) => part.trim()))
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [];
}

function parseBooleanParam(value: string | null): boolean | null {
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return null;
}

/**
 * Category-specific formal filters (registry `urlKey`s) → RPC arg axes.
 * `getSearchAttrFilterSpecs` already excludes genre/feature_tag (handled
 * separately above) so this never double-parses `genre` / `tag`.
 */
function parseAttrFiltersForCategory(
  source: CatalogSearchParamSource,
  category: ProjectCategoryId | null,
): Partial<Record<CatalogAttrParamKey, string[]>> {
  const result: Partial<Record<CatalogAttrParamKey, string[]>> = {};
  if (!category) return result;

  for (const spec of getSearchAttrFilterSpecs(category)) {
    const paramKey = CATALOG_ATTR_FIELD_TO_PARAM_KEY[spec.fieldId];
    if (!paramKey) continue;

    const raw = readMulti(source, spec.urlKey);
    let values = parseAllowlistedMulti(
      raw,
      spec.options.map((option) => option.value),
      spec.maxSelection,
    );
    if (spec.fieldId === "play_environment") {
      values = values
        .map((value) => mapPlayEnvironmentUiToStorageTag(value))
        .filter((value): value is string => Boolean(value));
    }
    if (values.length > 0) {
      result[paramKey] = values;
    }
  }
  return result;
}

/** Reverse of `parseAttrFiltersForCategory` for query-string reconstruction. */
function writeAttrFiltersToQuery(
  params: URLSearchParams,
  category: ProjectCategoryId | null,
  parsed: CatalogSearchParams,
): void {
  if (!category) return;
  for (const spec of getSearchAttrFilterSpecs(category)) {
    const paramKey = CATALOG_ATTR_FIELD_TO_PARAM_KEY[spec.fieldId];
    if (!paramKey) continue;

    const values = parsed[paramKey];
    if (!values || values.length === 0) continue;
    const uiValues =
      spec.fieldId === "play_environment"
        ? values
            .map((value) => mapPlayEnvironmentStorageTagToUi(value))
            .filter((value): value is NonNullable<typeof value> => Boolean(value))
        : values;
    if (uiValues.length > 0) {
      params.set(spec.urlKey, uiValues.join(","));
    }
  }
}

/** Normalize Search / catalog API query params (shared by page + route). */
export function parseCatalogSearchParams(
  source: CatalogSearchParamSource,
): CatalogSearchParams {
  const categoryRaw = readParam(source, "category")?.trim() ?? null;
  const category =
    categoryRaw && categoryRaw !== "all" && isProjectCategoryId(categoryRaw)
      ? (categoryRaw as ProjectCategoryId)
      : null;

  const sort = readParam(source, "sort")?.trim() || "newest";
  const streamPolicy = readParam(source, "stream_policy")?.trim() || null;
  const assetKindRaw = readParam(source, "asset_kind")?.trim() || null;
  const assetKind = isAssetKindFilter(assetKindRaw)
    ? (assetKindRaw as AssetKindId)
    : null;

  const limitRaw = Number.parseInt(readParam(source, "limit") ?? "", 10);
  const offsetRaw = Number.parseInt(readParam(source, "offset") ?? "", 10);

  const query = sanitizeSearchQuery(readParam(source, "q"));
  const genres =
    category === "game"
      ? parseGenreFilterValues(readMulti(source, "genre"))
      : [];
  const tags =
    category === "game"
      ? parseFeatureTagFilterValues(readMulti(source, "tag"))
      : [];

  const attrFilters = parseAttrFiltersForCategory(source, category);

  return {
    category,
    sort,
    query: query || null,
    genres: genres.length > 0 ? genres : null,
    tags: tags.length > 0 ? tags : null,
    quickTry: parseBooleanParam(readParam(source, "quick_try")),
    feedbackWanted: parseBooleanParam(readParam(source, "feedback_wanted")),
    usableForCreation: parseBooleanParam(
      readParam(source, "usable_for_creation"),
    ),
    streamPolicy,
    assetKind,
    ...attrFilters,
    limit: Number.isFinite(limitRaw) ? limitRaw : undefined,
    offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
  };
}

/** Stable query string for catalog API / client cache key comparison. */
export function buildCatalogQueryString(
  source: CatalogSearchParamSource,
  options?: { limit?: number },
): string {
  const parsed = parseCatalogSearchParams(source);
  const params = new URLSearchParams();

  if (parsed.category) {
    params.set("category", parsed.category);
  }
  if (parsed.sort) {
    params.set("sort", parsed.sort);
  }
  if (parsed.query) {
    params.set("q", parsed.query);
  }
  if (parsed.genres && parsed.genres.length > 0) {
    params.set("genre", parsed.genres.join(","));
  }
  if (parsed.tags && parsed.tags.length > 0) {
    params.set("tag", parsed.tags.join(","));
  }
  if (parsed.quickTry === true) {
    params.set("quick_try", "1");
  }
  if (parsed.feedbackWanted === true) {
    params.set("feedback_wanted", "1");
  }
  if (parsed.usableForCreation === true) {
    params.set("usable_for_creation", "1");
  }
  if (parsed.streamPolicy) {
    params.set("stream_policy", parsed.streamPolicy);
  }
  if (parsed.assetKind) {
    params.set("asset_kind", parsed.assetKind);
  }
  writeAttrFiltersToQuery(
    params,
    parsed.category && isProjectCategoryId(parsed.category)
      ? parsed.category
      : null,
    parsed,
  );
  params.set(
    "limit",
    String(options?.limit ?? parsed.limit ?? PLAYER_IA_SEARCH_CATALOG_LIMIT),
  );

  return params.toString();
}
