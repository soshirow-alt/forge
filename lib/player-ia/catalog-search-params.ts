import {
  isProjectCategoryId,
  type AssetKindId,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import { isAssetKindFilter } from "@/lib/supabase/public-catalog-db";
import type { CatalogSearchParams } from "@/lib/supabase/public-catalog-db";
import {
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
  params.set(
    "limit",
    String(options?.limit ?? parsed.limit ?? PLAYER_IA_SEARCH_CATALOG_LIMIT),
  );

  return params.toString();
}
