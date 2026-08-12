import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fillCategoryHomeHeroWorks,
  type CategoryHomeHeroWork,
} from "@/lib/player-ia/category-home-hero";
import {
  extraFromPublicFeedbackCards,
  mergeFeedbackGatheringFill,
} from "@/lib/player-ia/feedback-gathering-fill";
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
  PROJECT_CATEGORY_IDS,
  isProjectCategoryId,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import { safeHttpThumbnailUrl } from "@/lib/safe-http-thumbnail";
import {
  fetchHomeFeaturedHero,
  mapFeaturedHeroRowToCard,
  withPlayPlayerCountsOnCards,
  type HomeFeaturedHeroCard,
} from "@/lib/supabase/home-discovery-db";
import { fetchPublicProjectsByCategory } from "@/lib/supabase/public-catalog-db";
import {
  fetchPublicFeedbackCardsForHomeFill,
  listProjectIdsWithVisibleFeedbackSignals,
} from "@/lib/supabase/public-feedback-cards-server";

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
  starts_at?: string | null;
  ends_at?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  is_active?: boolean | null;
};

export type PlatformAnnouncement = {
  id: string;
  slug: string;
  title: string;
  body: string;
  summary: string;
  importance: "normal" | "important";
  publishedAt: string;
  startsAt?: string | null;
  endsAt?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  isActive?: boolean;
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
  categoryHasPublicWork: Record<ProjectCategoryId, boolean>;
  meta: {
    feedbackWindowDays: 30 | 90 | null;
  };
};

export type PlayerIaCategoryHomePayload = {
  category: ProjectCategoryId;
  hasPublicWork: boolean;
  spotlight: HomeNewestProject[];
  heroWorks: CategoryHomeHeroWork[];
  meaningfulUpdates: HomeMeaningfulUpdate[];
  newestProjects: HomeNewestProject[];
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
    startsAt: row.starts_at ? asString(row.starts_at) : null,
    endsAt: row.ends_at ? asString(row.ends_at) : null,
    ctaLabel: row.cta_label ? asString(row.cta_label) : null,
    ctaUrl: row.cta_url ? asString(row.cta_url) : null,
    isActive: row.is_active == null ? undefined : asBoolean(row.is_active),
  };
}

function newestToHeroWork(item: HomeNewestProject): CategoryHomeHeroWork {
  return {
    projectId: item.projectId,
    title: item.title,
    description: item.description,
    category: item.category,
    creator: item.creator,
    publishedAt: item.firstPublishedAt,
  };
}

function featuredCardToHeroWork(card: HomeFeaturedHeroCard): CategoryHomeHeroWork {
  return {
    projectId: card.id,
    title: card.title,
    description: card.description,
    category: "game",
    genre: card.genre ?? null,
  };
}

function updateToHeroWork(item: HomeMeaningfulUpdate): CategoryHomeHeroWork {
  return {
    projectId: item.projectId,
    title: item.title,
    description: item.updateSummary,
    category: item.category,
  };
}

async function fetchAllPublicCatalog(
  supabase: SupabaseClient,
): Promise<Awaited<ReturnType<typeof fetchPublicProjectsByCategory>>> {
  const pageSize = 60;
  const all: Awaited<ReturnType<typeof fetchPublicProjectsByCategory>> = [];
  let offset = 0;
  while (true) {
    const page = await fetchPublicProjectsByCategory(supabase, {
      limit: pageSize,
      offset,
    });
    all.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

async function fetchGuestSubmitterKeys(
  supabase: SupabaseClient,
  projectId: string,
): Promise<string[]> {
  const [voice, detailed] = await Promise.all([
    supabase
      .from("project_guest_voice_responses")
      .select("submitter_key")
      .eq("project_id", projectId)
      .eq("include_in_public_aggregate", true)
      .eq("moderation_status", "visible"),
    supabase
      .from("project_guest_feedback")
      .select("submitter_key")
      .eq("project_id", projectId)
      .eq("include_in_public_aggregate", true)
      .eq("moderation_status", "visible"),
  ]);
  if (voice.error || detailed.error) {
    return [];
  }
  return [
    ...(voice.data ?? []).map((row) => String(row.submitter_key ?? "")),
    ...(detailed.data ?? []).map((row) => String(row.submitter_key ?? "")),
  ].filter(Boolean);
}

const HOME_FB_FILL_PROBE_CONCURRENCY = 8;

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(Math.max(concurrency, 1), items.length) },
    async () => {
      while (true) {
        const index = nextIndex;
        nextIndex += 1;
        if (index >= items.length) return;
        results[index] = await mapper(items[index]!);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

async function fillFeedbackGatheringFromPublicWorks(
  supabase: SupabaseClient,
  ranked: HomeFeedbackGatheringProject[],
): Promise<HomeFeedbackGatheringProject[]> {
  if (ranked.length >= 4) return ranked;
  try {
    const catalog = await fetchAllPublicCatalog(supabase);
    if (catalog.length === 0) return ranked;

    const seen = new Set(ranked.map((item) => item.projectId));
    const targets = catalog.filter((project) => !seen.has(project.projectId));
    const signalIds = await listProjectIdsWithVisibleFeedbackSignals(
      supabase,
      targets.map((project) => project.projectId),
    );
    const candidates = targets.filter((project) =>
      signalIds.has(project.projectId),
    );

    const probed = await mapPool(
      candidates,
      HOME_FB_FILL_PROBE_CONCURRENCY,
      async (project) => {
        const { cards, participantCount } =
          await fetchPublicFeedbackCardsForHomeFill(supabase, project.projectId, {
            limit: 100,
          });
        if (cards.length < 1) return null;
        const guestSubmitterKeys = await fetchGuestSubmitterKeys(
          supabase,
          project.projectId,
        );
        return extraFromPublicFeedbackCards(
          {
            projectId: project.projectId,
            title: displayPlayerIaHomeSeedText(project.projectId, project.title),
            category: project.category,
            description: displayPlayerIaHomeSeedText(
              project.projectId,
              project.description,
            ),
            thumbnail: project.thumbnail,
            fallbackLastAt:
              project.meaningfulUpdateAt ?? project.firstPublishedAt,
          },
          cards,
          participantCount,
          guestSubmitterKeys,
        );
      },
    );
    const extras = probed.filter(
      (item): item is HomeFeedbackGatheringProject => item !== null,
    );
    return mergeFeedbackGatheringFill(ranked, extras, 4);
  } catch (error) {
    console.error("[player-ia-home] feedback fill failed", error);
    return ranked;
  }
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
  category: ProjectCategoryId | null = null,
): Promise<HomeFeedbackGatheringProject[]> {
  const { data, error } = await supabase.rpc(
    "get_home_feedback_gathering_projects",
    { p_limit: limit, p_category: category },
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
  category: ProjectCategoryId | null = null,
): Promise<HomeMeaningfulUpdate[]> {
  const { data, error } = await supabase.rpc("get_home_meaningful_updates", {
    p_limit: limit,
    p_category: category,
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

export async function fetchPublicPlatformAnnouncementArchive(
  supabase: SupabaseClient,
  limit = 50,
  offset = 0,
): Promise<PlatformAnnouncement[]> {
  const { data, error } = await supabase.rpc(
    "get_public_platform_announcement_archive",
    {
      p_limit: limit,
      p_offset: offset,
    },
  );
  if (error) {
    console.error(
      "[player-ia-home] get_public_platform_announcement_archive failed",
      error,
    );
    // Fallback for environments that have not applied 094 yet.
    return fetchPublicPlatformAnnouncements(supabase, limit);
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
  category: ProjectCategoryId | null = null,
): Promise<HomeNewestProject[]> {
  const { data, error } = await supabase.rpc("get_home_newest_projects", {
    p_limit: limit,
    p_category: category,
  });
  if (error) {
    console.error("[player-ia-home] get_home_newest_projects failed", error);
    return [];
  }
  return ((data ?? []) as HomeNewestProjectRow[]).map(mapNewestProject);
}

export type PlayerIaGameHomePayload = {
  /** Production `get_home_featured_hero` slots, soft-filtered to category=game. */
  featuredHero: HomeFeaturedHeroCard[];
  /** Shared 1+3 hero set: featured ranking first, then newest/update fill. */
  heroWorks: CategoryHomeHeroWork[];
  meaningfulUpdates: HomeMeaningfulUpdate[];
  newestProjects: HomeNewestProject[];
};

/**
 * Keep Production featured-hero ranking/slots; drop non-game slides for
 * `/home/game` without re-picking replacements (empty slots stay empty).
 */
export async function filterFeaturedHeroCardsToGameCategory(
  supabase: SupabaseClient,
  cards: HomeFeaturedHeroCard[],
): Promise<HomeFeaturedHeroCard[]> {
  if (cards.length === 0) return [];
  const ids = cards.map((card) => card.id);
  const { data, error } = await supabase
    .from("projects")
    .select("id, category")
    .in("id", ids);
  if (error) {
    console.error("[player-ia-game-home] category lookup failed", {
      message: error.message,
    });
    return [];
  }
  const gameIds = new Set(
    (data ?? [])
      .filter((row) => row.category === "game")
      .map((row) => String(row.id)),
  );
  return cards.filter((card) => gameIds.has(card.id));
}

/**
 * Game category Home: Production featured-hero carousel (same RPC/ranking) +
 * IA update/newest shelves scoped to category=game via RPC `p_category`.
 */
export async function fetchPlayerIaGameHome(
  supabase: SupabaseClient,
): Promise<PlayerIaGameHomePayload> {
  const [heroRows, updateCandidates, newestCandidates] = await Promise.all([
    fetchHomeFeaturedHero(supabase),
    fetchHomeMeaningfulUpdates(supabase, 24, "game"),
    fetchHomeNewestProjects(supabase, 16, "game"),
  ]);

  const featuredAll = heroRows
    .map(mapFeaturedHeroRowToCard)
    .filter((card): card is HomeFeaturedHeroCard => Boolean(card))
    .sort((a, b) => a.slotRank - b.slotRank);
  const featuredHeroFiltered = await filterFeaturedHeroCardsToGameCategory(
    supabase,
    featuredAll,
  );
  // Same public play stats merge as Production discovery feed; failures leave
  // playPlayerCount null without failing the whole game Home payload.
  const featuredHero = await withPlayPlayerCountsOnCards(
    supabase,
    featuredHeroFiltered,
  );

  const shown = new Set(featuredHero.map((card) => card.id));
  const meaningfulUpdates = softSuppressByCategory(
    softSuppressCrossShelfProject(
      updateCandidates.filter((item) => item.category === "game"),
      12,
      shown,
    ),
    4,
  );
  const shownAfterUpdates = new Set([
    ...shown,
    ...collectProjectIds(meaningfulUpdates),
  ]);
  const newestProjects = softAdjustNewestChronology(
    softSuppressCrossShelfProject(newestCandidates, 16, shownAfterUpdates),
    4,
  );

  const heroWorks = fillCategoryHomeHeroWorks(
    featuredHero.map(featuredCardToHeroWork),
    [
      ...newestCandidates
        .filter((item) => item.category === "game")
        .map(newestToHeroWork),
      ...updateCandidates
        .filter((item) => item.category === "game")
        .map(updateToHeroWork),
    ],
  );

  return {
    featuredHero,
    heroWorks,
    meaningfulUpdates,
    newestProjects,
  };
}

function emptyCategoryPresence(): Record<ProjectCategoryId, boolean> {
  return {
    game: false,
    audio: false,
    asset: false,
    "dev-tool": false,
    "service-app": false,
  };
}

export async function fetchPublicCategoryPresence(
  supabase: SupabaseClient,
): Promise<Record<ProjectCategoryId, boolean>> {
  const presence = emptyCategoryPresence();
  const rows = await Promise.all(
    PROJECT_CATEGORY_IDS.map(async (id) => {
      const newest = await fetchHomeNewestProjects(supabase, 1, id);
      return [id, newest.length > 0] as const;
    }),
  );
  for (const [id, hasWork] of rows) {
    presence[id] = hasWork;
  }
  return presence;
}

export async function fetchPlayerIaCategoryHome(
  supabase: SupabaseClient,
  category: ProjectCategoryId,
): Promise<PlayerIaCategoryHomePayload> {
  const [updateCandidates, newestCandidates] = await Promise.all([
    fetchHomeMeaningfulUpdates(supabase, 24, category),
    fetchHomeNewestProjects(supabase, 16, category),
  ]);
  const updates = updateCandidates.filter((item) => item.category === category);
  const newest = newestCandidates.filter((item) => item.category === category);
  const hasPublicWork = newest.length > 0 || updates.length > 0;
  const spotlight = newest.slice(0, 4);
  const heroWorks = fillCategoryHomeHeroWorks(
    spotlight.map(newestToHeroWork),
    updates.map(updateToHeroWork),
  );
  const spotlightIds = new Set(heroWorks.map((item) => item.projectId));
  const meaningfulUpdates = updates
    .filter((item) => !spotlightIds.has(item.projectId))
    .slice(0, 8);
  const newestProjects = newest
    .filter((item) => !spotlightIds.has(item.projectId))
    .slice(0, 8);
  return {
    category,
    hasPublicWork,
    spotlight,
    heroWorks,
    meaningfulUpdates,
    newestProjects,
  };
}

function assemblePlayerIaHomeShelves(input: {
  feedbackCandidates: HomeFeedbackGatheringProject[];
  updateCandidates: HomeMeaningfulUpdate[];
  usageCandidates: HomeUsageRelation[];
  announcements: PlatformAnnouncement[];
  newestCandidates: HomeNewestProject[];
  categoryHasPublicWork?: Record<ProjectCategoryId, boolean>;
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
    categoryHasPublicWork:
      input.categoryHasPublicWork ?? emptyCategoryPresence(),
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
    categoryHasPublicWork,
  ] = await Promise.all([
    fetchHomeFeedbackGatheringProjects(supabase, 16),
    fetchHomeMeaningfulUpdates(supabase, 16),
    fetchHomeUsageRelations(supabase, 24),
    fetchPublicPlatformAnnouncements(supabase, 5),
    fetchHomeNewestProjects(supabase, 16),
    fetchPublicCategoryPresence(supabase),
  ]);

  const filledFeedback = await fillFeedbackGatheringFromPublicWorks(
    supabase,
    feedbackCandidates,
  );

  return assemblePlayerIaHomeShelves({
    feedbackCandidates: filledFeedback,
    updateCandidates,
    usageCandidates,
    announcements,
    newestCandidates,
    categoryHasPublicWork,
  });
}

/** Exported for unit-style verification without a live DB. */
export { assemblePlayerIaHomeShelves };
