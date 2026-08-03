import type { SupabaseClient } from "@supabase/supabase-js";
import {
  collectProjectIds,
  softAdjustNewestChronology,
  softSuppressByCategory,
  softSuppressCrossShelfProject,
  selectUsagePairs,
} from "@/lib/player-ia/home-shelf-selection";
import { publicProjectThumbnailPath } from "@/lib/public-project-thumbnail";
import { displayPlayerIaHomeSeedText } from "@/lib/player-ia/format";
import {
  isProjectCategoryId,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import { safeHttpThumbnailUrl } from "@/lib/safe-http-thumbnail";

export type HomeFeedbackGatheringRow = {
  project_id: string;
  title: string;
  category: string;
  description: string | null;
  thumbnail_url: string | null;
  window_days: number | string;
  distinct_author_count: number | string;
  feedback_count: number | string;
  has_creator_reply: boolean;
  last_feedback_at: string;
  empathy_count: number | string;
};

export type HomeFeedbackGatheringProject = {
  projectId: string;
  title: string;
  category: ProjectCategoryId;
  description: string;
  thumbnail: string;
  windowDays: number;
  distinctAuthorCount: number;
  feedbackCount: number;
  hasCreatorReply: boolean;
  lastFeedbackAt: string;
};

export type HomeMeaningfulUpdateRow = {
  project_id: string;
  title: string;
  category: string;
  thumbnail_url: string | null;
  update_kind: string;
  update_label: string;
  update_summary: string;
  published_version: string | null;
  meaningful_update_at: string;
};

export type HomeMeaningfulUpdate = {
  projectId: string;
  title: string;
  category: ProjectCategoryId;
  thumbnail: string;
  updateKind: string;
  updateLabel: string;
  updateSummary: string;
  publishedVersion: string | null;
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
  summary: string;
  importance: "normal" | "important";
  publishedAt: string;
};

export type HomeNewestProjectRow = {
  project_id: string;
  title: string;
  category: string;
  description: string | null;
  thumbnail_url: string | null;
  first_published_at: string;
  creator: string;
};

export type HomeNewestProject = {
  projectId: string;
  title: string;
  category: ProjectCategoryId;
  description: string;
  thumbnail: string;
  firstPublishedAt: string;
  creator: string;
};

export type PlayerIaHomePayload = {
  feedbackGathering: HomeFeedbackGatheringProject[];
  meaningfulUpdates: HomeMeaningfulUpdate[];
  usageRelations: HomeUsageRelation[];
  announcements: PlatformAnnouncement[];
  newestProjects: HomeNewestProject[];
  meta: {
    feedbackWindowDays: 30 | 90 | null;
  };
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function asNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function asBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "t";
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

/** Safe short summary from announcement body — no dedicated DB column. */
export function summarizeAnnouncementBody(body: string, maxLen = 72): string {
  const collapsed = body
    .replace(/\r\n/g, "\n")
    .replace(/[#>*_`[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (collapsed.length <= maxLen) return collapsed;
  return `${collapsed.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`;
}

function mapFeedbackGathering(
  row: HomeFeedbackGatheringRow,
): HomeFeedbackGatheringProject {
  const projectId = asString(row.project_id);
  return {
    projectId,
    title: displayPlayerIaHomeSeedText(projectId, asString(row.title)),
    category: normalizeCategory(row.category),
    description: displayPlayerIaHomeSeedText(
      projectId,
      asString(row.description),
    ),
    thumbnail: projectThumbnailPath(projectId, row.thumbnail_url),
    windowDays: asNumber(row.window_days),
    distinctAuthorCount: asNumber(row.distinct_author_count),
    feedbackCount: asNumber(row.feedback_count),
    hasCreatorReply: asBoolean(row.has_creator_reply),
    lastFeedbackAt: asString(row.last_feedback_at),
  };
}

function mapMeaningfulUpdate(row: HomeMeaningfulUpdateRow): HomeMeaningfulUpdate {
  const projectId = asString(row.project_id);
  const version = asNullableString(row.published_version);
  return {
    projectId,
    title: displayPlayerIaHomeSeedText(projectId, asString(row.title)),
    category: normalizeCategory(row.category),
    thumbnail: projectThumbnailPath(projectId, row.thumbnail_url),
    updateKind: asString(row.update_kind),
    updateLabel: asString(row.update_label) || "更新",
    updateSummary: displayPlayerIaHomeSeedText(
      projectId,
      asString(row.update_summary),
    ),
    publishedVersion: version,
    meaningfulUpdateAt: asString(row.meaningful_update_at),
  };
}

function mapUsageRelation(row: HomeUsageRelationRow): HomeUsageRelation {
  const sourceProjectId = asString(row.source_project_id);
  const targetProjectId = asString(row.target_project_id);
  return {
    id: asString(row.id),
    sourceProjectId,
    sourceTitle: displayPlayerIaHomeSeedText(
      sourceProjectId,
      asString(row.source_title),
    ),
    sourceCategory: normalizeCategory(row.source_category),
    sourceThumbnail: projectThumbnailPath(
      sourceProjectId,
      row.source_thumbnail_url,
    ),
    targetProjectId,
    targetTitle: displayPlayerIaHomeSeedText(
      targetProjectId,
      asString(row.target_title),
    ),
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
  const body = asString(row.body);
  return {
    id: asString(row.id),
    slug: asString(row.slug),
    title: asString(row.title),
    body,
    summary: summarizeAnnouncementBody(body),
    importance,
    publishedAt: asString(row.published_at),
  };
}

function mapNewestProject(row: HomeNewestProjectRow): HomeNewestProject {
  const projectId = asString(row.project_id);
  return {
    projectId,
    title: displayPlayerIaHomeSeedText(projectId, asString(row.title)),
    category: normalizeCategory(row.category),
    description: displayPlayerIaHomeSeedText(
      projectId,
      asString(row.description),
    ),
    thumbnail: projectThumbnailPath(projectId, row.thumbnail_url),
    firstPublishedAt: asString(row.first_published_at),
    creator: asString(row.creator),
  };
}

export async function fetchHomeFeedbackGatheringProjects(
  supabase: SupabaseClient,
  limit = 16,
): Promise<HomeFeedbackGatheringProject[]> {
  const { data, error } = await supabase.rpc(
    "get_home_feedback_gathering_projects",
    { p_limit: limit },
  );
  if (error) {
    console.error(
      "[player-ia-home] get_home_feedback_gathering_projects failed",
      error,
    );
    return [];
  }
  return ((data ?? []) as HomeFeedbackGatheringRow[]).map(mapFeedbackGathering);
}

export async function fetchHomeMeaningfulUpdates(
  supabase: SupabaseClient,
  limit = 16,
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
      p_limit: options?.limit ?? 24,
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
  limit = 24,
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
  limit = 16,
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

function assemblePlayerIaHomeShelves(input: {
  feedbackCandidates: HomeFeedbackGatheringProject[];
  updateCandidates: HomeMeaningfulUpdate[];
  usageCandidates: HomeUsageRelation[];
  announcements: PlatformAnnouncement[];
  newestCandidates: HomeNewestProject[];
}): PlayerIaHomePayload {
  const feedbackGathering = softSuppressByCategory(input.feedbackCandidates, 4);

  const shownAfterFeedback = collectProjectIds(feedbackGathering);

  const updatePool = softSuppressCrossShelfProject(
    input.updateCandidates,
    12,
    shownAfterFeedback,
  );
  const meaningfulUpdates = softSuppressByCategory(updatePool, 4);

  const shownAfterUpdates = new Set([
    ...shownAfterFeedback,
    ...collectProjectIds(meaningfulUpdates),
  ]);

  // Usage may reappear as either side of a pair.
  const usageRelations = selectUsagePairs(input.usageCandidates, 4);

  // Newest: chronology first; soft-skip projects already on FB/Updates; category adjust only if all 4 same.
  const newestChronological = softSuppressCrossShelfProject(
    input.newestCandidates,
    16,
    shownAfterUpdates,
  );
  const newestProjects = softAdjustNewestChronology(newestChronological, 4);

  const windowDaysRaw = feedbackGathering[0]?.windowDays ?? null;
  const feedbackWindowDays: 30 | 90 | null =
    windowDaysRaw === 30 || windowDaysRaw === 90 ? windowDaysRaw : null;

  return {
    feedbackGathering,
    meaningfulUpdates,
    usageRelations,
    announcements: input.announcements.slice(0, 5),
    newestProjects,
    meta: { feedbackWindowDays },
  };
}

export async function fetchPlayerIaHome(
  supabase: SupabaseClient,
): Promise<PlayerIaHomePayload> {
  const [
    feedbackCandidates,
    updateCandidates,
    usageCandidates,
    announcements,
    newestCandidates,
  ] = await Promise.all([
    fetchHomeFeedbackGatheringProjects(supabase, 16),
    fetchHomeMeaningfulUpdates(supabase, 16),
    fetchHomeUsageRelations(supabase, 24),
    fetchPublicPlatformAnnouncements(supabase, 5),
    fetchHomeNewestProjects(supabase, 16),
  ]);

  return assemblePlayerIaHomeShelves({
    feedbackCandidates,
    updateCandidates,
    usageCandidates,
    announcements,
    newestCandidates,
  });
}

/** Exported for unit-style verification without a live DB. */
export { assemblePlayerIaHomeShelves };
