import type { SupabaseClient } from "@supabase/supabase-js";
import type { HomeGameCard } from "@/lib/home-v0-mock-data";
import {
  featuredHeroReasonDetail,
  featuredHeroTypeLabel,
  type FeaturedHeroType,
} from "@/lib/home-featured-hero";
import {
  formatHomeDiscoveryTimeLabel,
  timeKindForSection,
} from "@/lib/home-discovery-time-label";
import type { HomeDiscoverySection, HeroSource } from "@/lib/home-discovery-selection";
import { safeHttpThumbnailUrl, safeHttpThumbnailUrls } from "@/lib/safe-http-thumbnail";
import { resolveProjectThumbnailUrlsFromRow } from "@/lib/project-thumbnails";
import { publicProjectThumbnailPath } from "@/lib/public-project-thumbnail";

export type HomeDiscoveryFeedRow = {
  section: HomeDiscoverySection;
  rank: number;
  project_id: string;
  title: string;
  description: string;
  playable_version: string;
  thumbnail_url: string | null;
  genre: string | null;
  first_published_at: string | null;
  meaningful_update_at: string | null;
  feedback_users_7d: number;
  watchers_7d: number;
  players_7d: number;
  last_engagement_at: string | null;
  card_time_at: string | null;
  feedback_participant_count: number;
  watch_count: number;
};

export type HomeFeaturedHeroRow = {
  featured_type: string;
  slot_rank: number;
  axis_rank: number;
  project_id: string;
  owner_id: string | null;
  title: string;
  description: string;
  playable_version: string;
  thumbnail_url: string | null;
  genre: string | null;
  first_published_at: string | null;
  meaningful_update_at: string | null;
  update_kind: string | null;
  feedback_users_7d: number;
  watchers_7d: number;
  players_7d: number;
  players_prev_7d: number;
  player_delta_7d: number;
  last_play_at: string | null;
  last_engagement_at: string | null;
  card_time_at: string | null;
  feedback_participant_count: number;
  watch_count: number;
};

export type HomeDiscoveryCard = HomeGameCard & {
  section: HomeDiscoverySection;
  rank: number;
  heroSource?: HeroSource;
  cardTimeAt: string | null;
  firstPublishedAt: string | null;
  meaningfulUpdateAt: string | null;
  lastEngagementAt: string | null;
  feedbackUsers7d: number;
  watchers7d: number;
  players7d: number;
};

export type HomeFeaturedHeroCard = HomeDiscoveryCard & {
  featuredType: FeaturedHeroType;
  axisRank: number;
  slotRank: number;
  ownerId: string | null;
  playersPrev7d: number;
  playerDelta7d: number;
  lastPlayAt: string | null;
  updateKind: string | null;
  featuredLabel: string;
  featuredReason: string;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function asNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function asNullableString(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value);
  return s.length > 0 ? s : null;
}

function parseFeaturedType(value: unknown): FeaturedHeroType | null {
  if (
    value === "reaction" ||
    value === "rising_plays" ||
    value === "newest" ||
    value === "updated"
  ) {
    return value;
  }
  return null;
}

/** Drop non-http thumbnails so cards use placeholders; never ship data: URLs. */
export function sanitizeHomeDiscoveryFeedRow(
  row: HomeDiscoveryFeedRow,
): HomeDiscoveryFeedRow {
  return {
    ...row,
    thumbnail_url: safeHttpThumbnailUrl(row.thumbnail_url),
  };
}

export function mapFeedRowToCard(row: HomeDiscoveryFeedRow): HomeDiscoveryCard {
  const section = row.section;
  const cardTimeAt = asNullableString(row.card_time_at);
  const projectId = asString(row.project_id);
  return {
    id: projectId,
    title: asString(row.title),
    version: asString(row.playable_version || "0.1"),
    description: asString(row.description ?? ""),
    image: publicProjectThumbnailPath(projectId),
    genre: asNullableString(row.genre) ?? undefined,
    updatedLabel: formatHomeDiscoveryTimeLabel(
      cardTimeAt,
      timeKindForSection(section),
    ),
    feedbackCount: asNumber(row.feedback_participant_count),
    watchCount: asNumber(row.watch_count),
    section,
    rank: asNumber(row.rank),
    cardTimeAt,
    firstPublishedAt: asNullableString(row.first_published_at),
    meaningfulUpdateAt: asNullableString(row.meaningful_update_at),
    lastEngagementAt: asNullableString(row.last_engagement_at),
    feedbackUsers7d: asNumber(row.feedback_users_7d),
    watchers7d: asNumber(row.watchers_7d),
    players7d: asNumber(row.players_7d),
  };
}

export function mapFeaturedHeroRowToCard(
  row: HomeFeaturedHeroRow,
): HomeFeaturedHeroCard | null {
  const featuredType = parseFeaturedType(row.featured_type);
  if (!featuredType) return null;

  const projectId = asString(row.project_id);
  const cardTimeAt = asNullableString(row.card_time_at);
  const feedbackUsers7d = asNumber(row.feedback_users_7d);
  const watchers7d = asNumber(row.watchers_7d);
  const players7d = asNumber(row.players_7d);
  const playersPrev7d = asNumber(row.players_prev_7d);
  const playerDelta7d = asNumber(row.player_delta_7d);
  const firstPublishedAt = asNullableString(row.first_published_at);
  const meaningfulUpdateAt = asNullableString(row.meaningful_update_at);
  const updateKind = asNullableString(row.update_kind);
  const section: HomeDiscoverySection =
    featuredType === "rising_plays" || featuredType === "reaction"
      ? "trending"
      : featuredType;

  return {
    id: projectId,
    title: asString(row.title),
    version: asString(row.playable_version || "0.1"),
    description: asString(row.description ?? ""),
    image: publicProjectThumbnailPath(projectId),
    genre: asNullableString(row.genre) ?? undefined,
    updatedLabel: formatHomeDiscoveryTimeLabel(
      cardTimeAt,
      timeKindForSection(section),
    ),
    feedbackCount: asNumber(row.feedback_participant_count),
    watchCount: asNumber(row.watch_count),
    section,
    rank: asNumber(row.slot_rank),
    heroSource: section as HeroSource,
    cardTimeAt,
    firstPublishedAt,
    meaningfulUpdateAt,
    lastEngagementAt: asNullableString(row.last_engagement_at),
    feedbackUsers7d,
    watchers7d,
    players7d,
    featuredType,
    axisRank: asNumber(row.axis_rank),
    slotRank: asNumber(row.slot_rank),
    ownerId: asNullableString(row.owner_id),
    playersPrev7d,
    playerDelta7d,
    lastPlayAt: asNullableString(row.last_play_at),
    updateKind,
    featuredLabel: featuredHeroTypeLabel(featuredType),
    featuredReason: featuredHeroReasonDetail({
      featuredType,
      feedbackUsers7d,
      watchers7d,
      players7d,
      playerDelta7d,
      firstPublishedAt,
      meaningfulUpdateAt,
      updateKind,
    }),
  };
}

export type HomeDiscoveryFeed = {
  newest: HomeDiscoveryCard[];
  updated: HomeDiscoveryCard[];
  trending: HomeDiscoveryCard[];
  /** 066 featured hero — empty when RPC missing / no slots. */
  hero: HomeFeaturedHeroCard[];
};

export function partitionHomeDiscoveryFeed(
  rows: HomeDiscoveryFeedRow[],
  heroRows: HomeFeaturedHeroRow[] = [],
): HomeDiscoveryFeed {
  const newest: HomeDiscoveryCard[] = [];
  const updated: HomeDiscoveryCard[] = [];
  const trending: HomeDiscoveryCard[] = [];

  for (const row of rows) {
    const card = mapFeedRowToCard(row);
    if (card.section === "newest") newest.push(card);
    else if (card.section === "updated") updated.push(card);
    else trending.push(card);
  }

  newest.sort((a, b) => a.rank - b.rank);
  updated.sort((a, b) => a.rank - b.rank);
  trending.sort((a, b) => a.rank - b.rank);

  const trendingVisible = trending.filter(
    (card) => card.feedbackUsers7d + card.watchers7d > 0,
  );

  const hero = heroRows
    .map(mapFeaturedHeroRowToCard)
    .filter((card): card is HomeFeaturedHeroCard => Boolean(card))
    .sort((a, b) => a.slotRank - b.slotRank);

  return { newest, updated, trending: trendingVisible, hero };
}

/**
 * While 066→067 rollout is in progress, any RPC failure must soft-fail so the
 * service-role compose fallback can still populate the hero. After 067 is
 * verified and the fallback is removed, tighten this again.
 */
function isUnusableFeaturedHeroRpc(error: unknown): boolean {
  if (!error) return false;
  if (typeof error !== "object") return true;
  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : String(error);
  const code =
    "code" in error && typeof error.code === "string" ? error.code : "";
  return (
    message.includes("does not exist") ||
    message.includes("Could not find") ||
    message.includes("permission denied") ||
    message.includes("DROP TABLE is not allowed") ||
    code === "0A000" ||
    code === "42501" ||
    code === "PGRST202" ||
    code === "42883"
  );
}

export async function fetchHomeFeaturedHero(
  supabase: SupabaseClient,
): Promise<HomeFeaturedHeroRow[]> {
  const { data, error } = await supabase.rpc("get_home_featured_hero");
  if (error) {
    if (isUnusableFeaturedHeroRpc(error)) {
      console.warn("[home-feed] get_home_featured_hero unavailable", {
        code: "code" in error ? error.code : undefined,
        message: error.message,
      });
      return [];
    }
    throw error;
  }
  return ((data ?? []) as HomeFeaturedHeroRow[]).map((row) => ({
    ...row,
    thumbnail_url: safeHttpThumbnailUrl(row.thumbnail_url),
  }));
}

export async function fetchHomeDiscoveryFeed(
  supabase: SupabaseClient,
): Promise<HomeDiscoveryFeed> {
  const { data, error } = await supabase.rpc("get_home_discovery_feed");
  if (error) {
    throw error;
  }
  const rows = ((data ?? []) as HomeDiscoveryFeedRow[]).map(
    sanitizeHomeDiscoveryFeedRow,
  );
  const shelves = partitionHomeDiscoveryFeed(rows, []);

  const { buildHomeFeaturedHero } = await import(
    "@/lib/supabase/home-featured-hero-server"
  );
  const { createServiceRoleReadClient } = await import(
    "@/lib/supabase/service-role"
  );

  let hero: HomeFeaturedHeroCard[] = [];
  try {
    // Prefer anon RPC (EXECUTE granted). Service role is only for compose
    // rising_plays when the RPC is missing/broken.
    hero = await buildHomeFeaturedHero(supabase, shelves, {
      composeClient: createServiceRoleReadClient() ?? supabase,
    });
  } catch (err) {
    console.error("[home-feed] featured hero failed", err);
    hero = [];
  }

  return { ...shelves, hero };
}

export async function fetchHomeDiscoveryFeedFromApi(): Promise<HomeDiscoveryFeed> {
  const response = await fetch("/api/discovery/home-feed", {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin",
  });
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(
      message || `home discovery feed failed (${response.status})`,
    );
  }
  const payload = (await response.json()) as {
    ok?: boolean;
    feed?: HomeDiscoveryFeed;
    message?: string;
  };
  if (!payload.ok || !payload.feed) {
    throw new Error(payload.message || "home discovery feed failed");
  }
  return {
    newest: payload.feed.newest ?? [],
    updated: payload.feed.updated ?? [],
    trending: payload.feed.trending ?? [],
    hero: payload.feed.hero ?? [],
  };
}

export async function fetchPublicProjectThumbnailUrlsByIds(
  supabase: SupabaseClient,
  projectIds: string[],
): Promise<Record<string, string[]>> {
  const uniqueIds = [...new Set(projectIds.filter(Boolean))];
  const result: Record<string, string[]> = {};
  if (uniqueIds.length === 0) {
    return result;
  }

  const { data, error } = await supabase
    .from("projects")
    .select("id, thumbnail_url")
    .eq("visibility", "public")
    .in("id", uniqueIds)
    .like("thumbnail_url", "http%");

  if (error) {
    throw error;
  }

  for (const row of (data ?? []) as {
    id: string;
    thumbnail_url?: string | null;
  }[]) {
    const safe = safeHttpThumbnailUrls(
      resolveProjectThumbnailUrlsFromRow({
        thumbnail_url: row.thumbnail_url,
        thumbnail_urls: null,
      }),
    );
    if (safe.length > 0) {
      result[row.id] = safe;
    }
  }

  return result;
}

export type PublishVersionWithDevlogResult = {
  projectId: string;
  playableVersion: string;
  devlogId: string;
  devlogCreatedAt: string;
  publishedVersion: string;
  authorId: string;
};

export async function publishProjectVersionWithDevlog(
  supabase: SupabaseClient,
  input: {
    projectId: string;
    versionKey: string;
    title: string;
    content: string;
  },
): Promise<PublishVersionWithDevlogResult> {
  const { data, error } = await supabase.rpc(
    "publish_project_version_with_devlog",
    {
      p_project_id: input.projectId,
      p_version_key: input.versionKey,
      p_title: input.title,
      p_content: input.content,
    },
  );

  if (error) {
    throw error;
  }

  const payload = (data ?? {}) as Record<string, unknown>;
  return {
    projectId: asString(payload.project_id),
    playableVersion: asString(payload.playable_version),
    devlogId: asString(payload.devlog_id),
    devlogCreatedAt: asString(payload.devlog_created_at),
    publishedVersion: asString(payload.published_version),
    authorId: asString(payload.author_id),
  };
}
