import type { SupabaseClient } from "@supabase/supabase-js";
import type { HomeGameCard } from "@/lib/home-v0-mock-data";
import {
  formatHomeDiscoveryTimeLabel,
  timeKindForSection,
} from "@/lib/home-discovery-time-label";
import type { HomeDiscoverySection, HeroSource } from "@/lib/home-discovery-selection";

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

export function mapFeedRowToCard(row: HomeDiscoveryFeedRow): HomeDiscoveryCard {
  const section = row.section;
  const cardTimeAt = asNullableString(row.card_time_at);
  return {
    id: asString(row.project_id),
    title: asString(row.title),
    version: asString(row.playable_version || "0.1"),
    description: asString(row.description ?? ""),
    image: asString(row.thumbnail_url ?? "").trim(),
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
  return partitionHomeDiscoveryFeed((data ?? []) as HomeDiscoveryFeedRow[]);
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
