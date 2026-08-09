import type { SupabaseClient } from "@supabase/supabase-js";
import { publicProjectThumbnailPath } from "@/lib/public-project-thumbnail";
import {
  isProjectCategoryId,
  type AssetKindId,
  type ProjectCategoryId,
  type StreamPolicyId,
} from "@/lib/project-categories";
import type { FormalFilterFieldId } from "@/lib/project-formal-filter-registry";
import { safeHttpThumbnailUrl } from "@/lib/safe-http-thumbnail";

/**
 * 2026-08 five-category formal filters (migration 085 RPC args).
 * Several category-specific `FormalFilterFieldId`s share one storage axis
 * (e.g. audio_kinds / dev_tool_kinds / service_kinds all read/write
 * `category_attributes.kinds` via `p_attr_kinds`) — never more than one
 * applies per request since each belongs to a single category.
 */
export type CatalogAttrParamKey =
  | "playTimes"
  | "playEnvs"
  | "playerCounts"
  | "attrKinds"
  | "attrMusicGenres"
  | "attrMoods"
  | "attrPurposes"
  | "durationBuckets"
  | "attrFormats"
  | "attrTastes"
  | "attrTools"
  | "attrEnvironments"
  | "attrFeatures"
  | "assetKinds";

export const CATALOG_ATTR_FIELD_TO_PARAM_KEY: Partial<
  Record<FormalFilterFieldId, CatalogAttrParamKey>
> = {
  play_time: "playTimes",
  play_environment: "playEnvs",
  player_count: "playerCounts",
  audio_kinds: "attrKinds",
  dev_tool_kinds: "attrKinds",
  service_kinds: "attrKinds",
  music_genres: "attrMusicGenres",
  audio_moods: "attrMoods",
  audio_purposes: "attrPurposes",
  service_purposes: "attrPurposes",
  audio_duration_bucket: "durationBuckets",
  asset_kind: "assetKinds",
  asset_formats: "attrFormats",
  asset_tastes: "attrTastes",
  asset_tools: "attrTools",
  dev_tool_environments: "attrEnvironments",
  service_environments: "attrEnvironments",
  dev_tool_features: "attrFeatures",
  service_features: "attrFeatures",
};

const CATALOG_ATTR_PARAM_TO_RPC_ARG: Record<CatalogAttrParamKey, string> = {
  playTimes: "p_play_times",
  playEnvs: "p_play_envs",
  playerCounts: "p_player_counts",
  attrKinds: "p_attr_kinds",
  attrMusicGenres: "p_attr_music_genres",
  attrMoods: "p_attr_moods",
  attrPurposes: "p_attr_purposes",
  durationBuckets: "p_duration_buckets",
  attrFormats: "p_attr_formats",
  attrTastes: "p_attr_tastes",
  attrTools: "p_attr_tools",
  attrEnvironments: "p_attr_environments",
  attrFeatures: "p_attr_features",
  assetKinds: "p_asset_kinds",
};

const CATALOG_ATTR_PARAM_KEYS = Object.keys(
  CATALOG_ATTR_PARAM_TO_RPC_ARG,
) as CatalogAttrParamKey[];

export type CatalogProjectRow = {
  project_id: string;
  title: string;
  description: string;
  category: string;
  thumbnail_url: string | null;
  creator: string;
  genres: string[] | null;
  tags: string[] | null;
  purpose_tags: string[] | null;
  asset_kinds: string[] | null;
  stream_policy: string | null;
  quick_try: boolean;
  usable_for_creation: boolean;
  looking_for_testers: boolean;
  first_published_at: string;
  meaningful_update_at: string | null;
};

export type CatalogProject = {
  projectId: string;
  title: string;
  description: string;
  category: ProjectCategoryId;
  thumbnail: string;
  creator: string;
  genres: string[];
  tags: string[];
  purposeTags: string[];
  assetKinds: string[];
  streamPolicy: StreamPolicyId;
  quickTry: boolean;
  usableForCreation: boolean;
  lookingForTesters: boolean;
  firstPublishedAt: string;
  meaningfulUpdateAt: string | null;
};

export type CatalogSearchParams = {
  category?: string | null;
  sort?: string | null;
  query?: string | null;
  genres?: string[] | null;
  tags?: string[] | null;
  quickTry?: boolean | null;
  feedbackWanted?: boolean | null;
  usableForCreation?: boolean | null;
  streamPolicy?: string | null;
  assetKind?: string | null;
  /** 2026-08 five-category formal filters (migration 085 RPC args). */
  playTimes?: string[] | null;
  playEnvs?: string[] | null;
  playerCounts?: string[] | null;
  attrKinds?: string[] | null;
  attrMusicGenres?: string[] | null;
  attrMoods?: string[] | null;
  attrPurposes?: string[] | null;
  durationBuckets?: string[] | null;
  attrFormats?: string[] | null;
  attrTastes?: string[] | null;
  attrTools?: string[] | null;
  attrEnvironments?: string[] | null;
  attrFeatures?: string[] | null;
  /** Multi asset kinds — sent as `p_asset_kinds`, OR'd with legacy `p_asset_kind`. */
  assetKinds?: string[] | null;
  limit?: number;
  offset?: number;
};

export type GlobalSearchResultRow = {
  result_kind: string;
  result_id: string;
  title: string;
  subtitle: string;
  category: string | null;
  thumbnail_url: string | null;
  rank: number | string;
};

export type GlobalSearchSuggestRow = {
  result_kind: string;
  result_id: string;
  title: string;
  subtitle: string;
  category: string | null;
};

export type GlobalSearchResult = {
  kind: "project" | "developer" | "tag";
  id: string;
  title: string;
  subtitle: string;
  category: ProjectCategoryId | null;
  thumbnail: string | null;
  rank: number;
};

export type GlobalSearchSuggest = {
  kind: "project" | "developer" | "tag";
  id: string;
  title: string;
  subtitle: string;
  category: ProjectCategoryId | null;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function normalizeCategory(value: unknown): ProjectCategoryId {
  const raw = asString(value);
  return isProjectCategoryId(raw) ? raw : "game";
}

function normalizeStreamPolicy(value: unknown): StreamPolicyId {
  const raw = asString(value);
  if (
    raw === "ok" ||
    raw === "conditional" ||
    raw === "no" ||
    raw === "unset"
  ) {
    return raw;
  }
  return "unset";
}

function normalizeSearchKind(
  value: unknown,
): "project" | "developer" | "tag" | null {
  const raw = asString(value);
  if (raw === "project" || raw === "developer" || raw === "tag") {
    return raw;
  }
  return null;
}

function mapCatalogProject(row: CatalogProjectRow): CatalogProject {
  const projectId = asString(row.project_id);
  void safeHttpThumbnailUrl(row.thumbnail_url);
  return {
    projectId,
    title: asString(row.title),
    description: asString(row.description),
    category: normalizeCategory(row.category),
    thumbnail: publicProjectThumbnailPath(projectId),
    creator: asString(row.creator),
    genres: row.genres ?? [],
    tags: row.tags ?? [],
    purposeTags: row.purpose_tags ?? [],
    assetKinds: row.asset_kinds ?? [],
    streamPolicy: normalizeStreamPolicy(row.stream_policy),
    quickTry: Boolean(row.quick_try),
    usableForCreation: Boolean(row.usable_for_creation),
    lookingForTesters: Boolean(row.looking_for_testers),
    firstPublishedAt: asString(row.first_published_at),
    meaningfulUpdateAt: row.meaningful_update_at
      ? asString(row.meaningful_update_at)
      : null,
  };
}

export async function fetchPublicProjectsByCategory(
  supabase: SupabaseClient,
  params: CatalogSearchParams,
): Promise<CatalogProject[]> {
  const limit = Math.min(Math.max(params.limit ?? 24, 1), 60);
  const offset = Math.max(params.offset ?? 0, 0);

  const query = params.query?.trim() ? params.query.trim() : null;
  const genres =
    params.genres && params.genres.length > 0 ? params.genres : null;
  const tags = params.tags && params.tags.length > 0 ? params.tags : null;
  // Only send 084 args when used so pre-migration Staging still serves
  // unfiltered catalog via the prior 9-arg signature.
  const rpcArgs: Record<string, unknown> = {
    p_category: params.category ?? null,
    p_sort: params.sort ?? "newest",
    p_quick_try: params.quickTry ?? null,
    p_feedback_wanted: params.feedbackWanted ?? null,
    p_usable_for_creation: params.usableForCreation ?? null,
    p_stream_policy: params.streamPolicy ?? null,
    p_asset_kind: params.assetKind ?? null,
    p_limit: limit,
    p_offset: offset,
  };
  if (query || genres || tags) {
    rpcArgs.p_query = query;
    rpcArgs.p_genres = genres;
    rpcArgs.p_tags = tags;
  }

  // Only send 085 args when used so pre-migration Staging/Production still
  // serve the catalog via the prior signature (no five-category filters).
  for (const key of CATALOG_ATTR_PARAM_KEYS) {
    const values = params[key];
    if (values && values.length > 0) {
      rpcArgs[CATALOG_ATTR_PARAM_TO_RPC_ARG[key]] = values;
    }
  }

  const { data, error } = await supabase.rpc(
    "get_public_projects_by_category",
    rpcArgs,
  );

  if (error) {
    console.error("[public-catalog] get_public_projects_by_category failed", error);
    throw error;
  }

  return ((data ?? []) as CatalogProjectRow[]).map(mapCatalogProject);
}

/** Drop pure-trigram noise below this (DB default is 0.05; too low for zero-hit queries). */
export const PUBLIC_CATALOG_SEARCH_MIN_RANK = 0.2;

export async function searchPublicCatalog(
  supabase: SupabaseClient,
  query: string,
  limit = 20,
): Promise<GlobalSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const { data, error } = await supabase.rpc("search_public_catalog", {
    p_query: trimmed,
    p_limit: Math.min(Math.max(limit, 1), 40),
  });

  if (error) {
    console.error("[public-catalog] search_public_catalog failed", error);
    throw error;
  }

  return ((data ?? []) as GlobalSearchResultRow[])
    .map((row) => {
      const kind = normalizeSearchKind(row.result_kind);
      if (!kind) {
        return null;
      }
      const rank = Number(row.rank) || 0;
      if (rank < PUBLIC_CATALOG_SEARCH_MIN_RANK) {
        return null;
      }
      const categoryRaw = row.category;
      return {
        kind,
        id: asString(row.result_id),
        title: asString(row.title),
        subtitle: asString(row.subtitle),
        category:
          kind === "project" && categoryRaw
            ? normalizeCategory(categoryRaw)
            : null,
        thumbnail:
          kind === "project"
            ? publicProjectThumbnailPath(asString(row.result_id))
            : kind === "developer"
              ? safeHttpThumbnailUrl(row.thumbnail_url)
              : null,
        rank,
      } satisfies GlobalSearchResult;
    })
    .filter((item): item is GlobalSearchResult => item !== null);
}

export async function searchPublicCatalogSuggest(
  supabase: SupabaseClient,
  query: string,
  limit = 8,
): Promise<GlobalSearchSuggest[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const { data, error } = await supabase.rpc("search_public_catalog_suggest", {
    p_query: trimmed,
    p_limit: Math.min(Math.max(limit, 1), 12),
  });

  if (error) {
    console.error("[public-catalog] search_public_catalog_suggest failed", error);
    throw error;
  }

  return ((data ?? []) as GlobalSearchSuggestRow[])
    .map((row) => {
      const kind = normalizeSearchKind(row.result_kind);
      if (!kind) {
        return null;
      }
      const categoryRaw = row.category;
      return {
        kind,
        id: asString(row.result_id),
        title: asString(row.title),
        subtitle: asString(row.subtitle),
        category:
          kind === "project" && categoryRaw
            ? normalizeCategory(categoryRaw)
            : null,
      } satisfies GlobalSearchSuggest;
    })
    .filter((item): item is GlobalSearchSuggest => item !== null);
}

export function isAssetKindFilter(value: string | null | undefined): value is AssetKindId {
  return typeof value === "string" && value.length > 0;
}
