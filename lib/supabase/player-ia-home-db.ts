import type { SupabaseClient } from "@supabase/supabase-js";
import { publicProjectThumbnailPath } from "@/lib/public-project-thumbnail";
import {
  isProjectCategoryId,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import { safeHttpThumbnailUrl } from "@/lib/safe-http-thumbnail";

export type HomeReviewHighlightRow = {
  card_id: string;
  project_id: string;
  project_title: string;
  project_category: string;
  project_thumbnail_url: string | null;
  author_kind: string;
  author_display_name: string;
  body_text: string;
  empathy_count: number | string;
  created_at: string;
};

export type HomeReviewHighlight = {
  cardId: string;
  projectId: string;
  projectTitle: string;
  projectCategory: ProjectCategoryId;
  projectThumbnail: string;
  authorKind: string;
  authorDisplayName: string;
  bodyText: string;
  empathyCount: number;
  createdAt: string;
};

export type HomeMeaningfulUpdateRow = {
  project_id: string;
  title: string;
  category: string;
  thumbnail_url: string | null;
  update_kind: string;
  meaningful_update_at: string;
};

export type HomeMeaningfulUpdate = {
  projectId: string;
  title: string;
  category: ProjectCategoryId;
  thumbnail: string;
  updateKind: string;
  meaningfulUpdateAt: string;
};

export type HomeUsageRelationRow = {
  id: string;
  source_project_id: string;
  source_title: string;
  source_category: string;
  source_thumbnail_url: string | null;
  target_project_id: string;
  target_title: string;
  target_category: string;
  target_thumbnail_url: string | null;
  relation_type: string;
  created_at: string;
};

export type HomeUsageRelation = {
  id: string;
  sourceProjectId: string;
  sourceTitle: string;
  sourceCategory: ProjectCategoryId;
  sourceThumbnail: string;
  targetProjectId: string;
  targetTitle: string;
  targetCategory: ProjectCategoryId;
  targetThumbnail: string;
  relationType: string;
  createdAt: string;
};

export type PlatformAnnouncementRow = {
  id: string;
  slug: string;
  title: string;
  body: string;
  importance: string;
  published_at: string;
};

export type PlatformAnnouncement = {
  id: string;
  slug: string;
  title: string;
  body: string;
  importance: "normal" | "important";
  publishedAt: string;
};

export type HomeNewestProjectRow = {
  project_id: string;
  title: string;
  category: string;
  thumbnail_url: string | null;
  first_published_at: string;
  creator: string;
};

export type HomeNewestProject = {
  projectId: string;
  title: string;
  category: ProjectCategoryId;
  thumbnail: string;
  firstPublishedAt: string;
  creator: string;
};

export type PlayerIaHomePayload = {
  reviewHighlights: HomeReviewHighlight[];
  meaningfulUpdates: HomeMeaningfulUpdate[];
  usageRelations: HomeUsageRelation[];
  announcements: PlatformAnnouncement[];
  newestProjects: HomeNewestProject[];
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function asNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeCategory(value: unknown): ProjectCategoryId {
  const raw = asString(value);
  return isProjectCategoryId(raw) ? raw : "game";
}

function projectThumbnailPath(projectId: string, rawUrl: unknown): string {
  void safeHttpThumbnailUrl(asNullableString(rawUrl));
  return publicProjectThumbnailPath(projectId);
}

function asNullableString(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value);
  return s.length > 0 ? s : null;
}

function mapReviewHighlight(row: HomeReviewHighlightRow): HomeReviewHighlight {
  const projectId = asString(row.project_id);
  return {
    cardId: asString(row.card_id),
    projectId,
    projectTitle: asString(row.project_title),
    projectCategory: normalizeCategory(row.project_category),
    projectThumbnail: projectThumbnailPath(projectId, row.project_thumbnail_url),
    authorKind: asString(row.author_kind),
    authorDisplayName: asString(row.author_display_name),
    bodyText: asString(row.body_text),
    empathyCount: asNumber(row.empathy_count),
    createdAt: asString(row.created_at),
  };
}

function mapMeaningfulUpdate(row: HomeMeaningfulUpdateRow): HomeMeaningfulUpdate {
  const projectId = asString(row.project_id);
  return {
    projectId,
    title: asString(row.title),
    category: normalizeCategory(row.category),
    thumbnail: projectThumbnailPath(projectId, row.thumbnail_url),
    updateKind: asString(row.update_kind),
    meaningfulUpdateAt: asString(row.meaningful_update_at),
  };
}

function mapUsageRelation(row: HomeUsageRelationRow): HomeUsageRelation {
  const sourceProjectId = asString(row.source_project_id);
  const targetProjectId = asString(row.target_project_id);
  return {
    id: asString(row.id),
    sourceProjectId,
    sourceTitle: asString(row.source_title),
    sourceCategory: normalizeCategory(row.source_category),
    sourceThumbnail: projectThumbnailPath(
      sourceProjectId,
      row.source_thumbnail_url,
    ),
    targetProjectId,
    targetTitle: asString(row.target_title),
    targetCategory: normalizeCategory(row.target_category),
    targetThumbnail: projectThumbnailPath(
      targetProjectId,
      row.target_thumbnail_url,
    ),
    relationType: asString(row.relation_type),
    createdAt: asString(row.created_at),
  };
}

function mapAnnouncement(row: PlatformAnnouncementRow): PlatformAnnouncement {
  const importance = row.importance === "important" ? "important" : "normal";
  return {
    id: asString(row.id),
    slug: asString(row.slug),
    title: asString(row.title),
    body: asString(row.body),
    importance,
    publishedAt: asString(row.published_at),
  };
}

function mapNewestProject(row: HomeNewestProjectRow): HomeNewestProject {
  const projectId = asString(row.project_id);
  return {
    projectId,
    title: asString(row.title),
    category: normalizeCategory(row.category),
    thumbnail: projectThumbnailPath(projectId, row.thumbnail_url),
    firstPublishedAt: asString(row.first_published_at),
    creator: asString(row.creator),
  };
}

export async function fetchHomeReviewHighlights(
  supabase: SupabaseClient,
  limit = 8,
): Promise<HomeReviewHighlight[]> {
  const { data, error } = await supabase.rpc("get_home_review_highlights", {
    p_limit: limit,
  });
  if (error) {
    console.error("[player-ia-home] get_home_review_highlights failed", error);
    return [];
  }
  return ((data ?? []) as HomeReviewHighlightRow[]).map(mapReviewHighlight);
}

export async function fetchHomeMeaningfulUpdates(
  supabase: SupabaseClient,
  limit = 8,
): Promise<HomeMeaningfulUpdate[]> {
  const { data, error } = await supabase.rpc("get_home_meaningful_updates", {
    p_limit: limit,
  });
  if (error) {
    console.error("[player-ia-home] get_home_meaningful_updates failed", error);
    return [];
  }
  return ((data ?? []) as HomeMeaningfulUpdateRow[]).map(mapMeaningfulUpdate);
}

export async function fetchPublicProjectUsageRelations(
  supabase: SupabaseClient,
  options?: { projectId?: string | null; limit?: number },
): Promise<HomeUsageRelation[]> {
  const { data, error } = await supabase.rpc(
    "get_public_project_usage_relations",
    {
      p_project_id: options?.projectId ?? null,
      p_limit: options?.limit ?? 12,
    },
  );
  if (error) {
    console.error(
      "[player-ia-home] get_public_project_usage_relations failed",
      error,
    );
    return [];
  }
  return ((data ?? []) as HomeUsageRelationRow[]).map(mapUsageRelation);
}

export async function fetchHomeUsageRelations(
  supabase: SupabaseClient,
  limit = 12,
): Promise<HomeUsageRelation[]> {
  return fetchPublicProjectUsageRelations(supabase, { projectId: null, limit });
}

export async function fetchPublicPlatformAnnouncements(
  supabase: SupabaseClient,
  limit = 5,
): Promise<PlatformAnnouncement[]> {
  const { data, error } = await supabase.rpc(
    "get_public_platform_announcements",
    {
      p_limit: limit,
      p_offset: 0,
    },
  );
  if (error) {
    console.error(
      "[player-ia-home] get_public_platform_announcements failed",
      error,
    );
    return [];
  }
  return ((data ?? []) as PlatformAnnouncementRow[]).map(mapAnnouncement);
}

export async function fetchPublicPlatformAnnouncementBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<PlatformAnnouncement | null> {
  const { data, error } = await supabase.rpc(
    "get_public_platform_announcement_by_slug",
    { p_slug: slug },
  );
  if (error) {
    console.error(
      "[player-ia-home] get_public_platform_announcement_by_slug failed",
      error,
    );
    return null;
  }
  const row = (data as PlatformAnnouncementRow[] | null)?.[0];
  return row ? mapAnnouncement(row) : null;
}

export async function fetchHomeNewestProjects(
  supabase: SupabaseClient,
  limit = 12,
): Promise<HomeNewestProject[]> {
  const { data, error } = await supabase.rpc("get_home_newest_projects", {
    p_limit: limit,
    p_category: null,
  });
  if (error) {
    console.error("[player-ia-home] get_home_newest_projects failed", error);
    return [];
  }
  return ((data ?? []) as HomeNewestProjectRow[]).map(mapNewestProject);
}

export async function fetchPlayerIaHome(
  supabase: SupabaseClient,
): Promise<PlayerIaHomePayload> {
  const [
    reviewHighlights,
    meaningfulUpdates,
    usageRelations,
    announcements,
    newestProjects,
  ] = await Promise.all([
    fetchHomeReviewHighlights(supabase),
    fetchHomeMeaningfulUpdates(supabase),
    fetchHomeUsageRelations(supabase),
    fetchPublicPlatformAnnouncements(supabase),
    fetchHomeNewestProjects(supabase),
  ]);

  return {
    reviewHighlights,
    meaningfulUpdates,
    usageRelations,
    announcements,
    newestProjects,
  };
}
