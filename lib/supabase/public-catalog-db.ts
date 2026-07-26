import type { SupabaseClient } from "@supabase/supabase-js";
import { publicProjectThumbnailPath } from "@/lib/public-project-thumbnail";
import {
  isProjectCategoryId,
  type AssetKindId,
  type ProjectCategoryId,
  type StreamPolicyId,
} from "@/lib/project-categories";
import { safeHttpThumbnailUrl } from "@/lib/safe-http-thumbnail";

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
  quickTry?: boolean | null;
  feedbackWanted?: boolean | null;
  usableForCreation?: boolean | null;
  streamPolicy?: string | null;
  assetKind?: string | null;
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

  const { data, error } = await supabase.rpc("get_public_projects_by_category", {
    p_category: params.category ?? null,
    p_sort: params.sort ?? "newest",
    p_quick_try: params.quickTry ?? null,
    p_feedback_wanted: params.feedbackWanted ?? null,
    p_usable_for_creation: params.usableForCreation ?? null,
    p_stream_policy: params.streamPolicy ?? null,
    p_asset_kind: params.assetKind ?? null,
    p_limit: limit,
    p_offset: offset,
  });

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
