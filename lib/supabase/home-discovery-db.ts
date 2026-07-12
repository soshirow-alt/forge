import type { SupabaseClient } from "@supabase/supabase-js";
import type { HomeGameCard } from "@/lib/home-v0-mock-data";
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

export type HomeDiscoveryFeed = {
  newest: HomeDiscoveryCard[];
  updated: HomeDiscoveryCard[];
  trending: HomeDiscoveryCard[];
};

export function partitionHomeDiscoveryFeed(
  rows: HomeDiscoveryFeedRow[],
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

  return { newest, updated, trending };
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
  return partitionHomeDiscoveryFeed(rows);
}

/**
 * Browser entry: server API strips data URL thumbnails before the body
 * reaches the client (RPC may still be fat until 059 is applied).
 */
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
  return payload.feed;
}

/**
 * http(s) thumbnails only — never select thumbnail_urls (may contain data URLs).
 * Used for hero extras without pulling multi-MB payloads.
 */
export async function fetchPublicProjectThumbnailUrlsByIds(
  supabase: SupabaseClient,
  projectIds: string[],
): Promise<Record<string, string[]>> {
  const uniqueIds = [...new Set(projectIds.filter(Boolean))];
  const result: Record<string, string[]> = {};
  if (uniqueIds.length === 0) {
    return result;
  }

  // like 'http%' matches http:// and https://; excludes data:image rows entirely.
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
