/**
 * Server-side featured hero builder (066 RPC preferred).
 * Fallback composes the same 4 slots from feed shelves + play-session windows
 * when get_home_featured_hero is not yet applied (Staging Dashboard pending).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  FEATURED_HERO_TYPE_ORDER,
  type FeaturedHeroType,
} from "@/lib/home-featured-hero";
import { pickFeaturedHeroSlots } from "@/lib/home-featured-hero-selection";
import {
  fetchHomeFeaturedHero,
  mapFeaturedHeroRowToCard,
  type HomeDiscoveryCard,
  type HomeFeaturedHeroCard,
  type HomeFeaturedHeroRow,
} from "@/lib/supabase/home-discovery-db";

type AxisCandidate = {
  id: string;
  featuredType: FeaturedHeroType;
  axisRank: number;
  ownerId?: string | null;
  card: HomeDiscoveryCard;
  playersPrev7d?: number;
  playerDelta7d?: number;
  lastPlayAt?: string | null;
  updateKind?: string | null;
};

function cardToHero(
  card: HomeDiscoveryCard,
  featuredType: FeaturedHeroType,
  slotRank: number,
  axisRank: number,
  extras?: {
    ownerId?: string | null;
    playersPrev7d?: number;
    playerDelta7d?: number;
    lastPlayAt?: string | null;
    updateKind?: string | null;
  },
): HomeFeaturedHeroCard {
  const row: HomeFeaturedHeroRow = {
    featured_type: featuredType,
    slot_rank: slotRank,
    axis_rank: axisRank,
    project_id: card.id,
    owner_id: extras?.ownerId ?? null,
    title: card.title,
    description: card.description,
    playable_version: card.version,
    thumbnail_url: null,
    genre: card.genre ?? null,
    first_published_at: card.firstPublishedAt,
    meaningful_update_at: card.meaningfulUpdateAt,
    update_kind: extras?.updateKind ?? null,
    feedback_users_7d: card.feedbackUsers7d,
    watchers_7d: card.watchers7d,
    players_7d: card.players7d,
    players_prev_7d: extras?.playersPrev7d ?? 0,
    player_delta_7d: extras?.playerDelta7d ?? 0,
    last_play_at: extras?.lastPlayAt ?? null,
    last_engagement_at: card.lastEngagementAt,
    card_time_at: card.cardTimeAt,
    feedback_participant_count: card.feedbackCount,
    watch_count: card.watchCount,
  };
  const mapped = mapFeaturedHeroRowToCard(row);
  if (!mapped) {
    throw new Error(`invalid featured type ${featuredType}`);
  }
  return mapped;
}

async function fetchRisingPlayCandidates(
  supabase: SupabaseClient,
  ownerByProject: Record<string, string | null>,
): Promise<AxisCandidate[]> {
  const now = Date.now();
  const windowStart = new Date(now - 7 * 86_400_000).toISOString();
  const prevStart = new Date(now - 14 * 86_400_000).toISOString();

  const { data, error } = await supabase
    .from("project_play_sessions")
    .select("project_id, user_id, played_at")
    .not("user_id", "is", null)
    .gte("played_at", prevStart);

  if (error || !data) {
    return [];
  }

  type Acc = {
    players7d: Set<string>;
    playersPrev: Set<string>;
    lastPlayAt: string | null;
  };
  const byProject = new Map<string, Acc>();

  for (const row of data as {
    project_id: string;
    user_id: string | null;
    played_at: string;
  }[]) {
    const projectId = String(row.project_id);
    const userId = row.user_id ? String(row.user_id) : "";
    if (!userId) continue;
    let acc = byProject.get(projectId);
    if (!acc) {
      acc = {
        players7d: new Set(),
        playersPrev: new Set(),
        lastPlayAt: null,
      };
      byProject.set(projectId, acc);
    }
    const playedAt = row.played_at;
    if (playedAt >= windowStart) {
      acc.players7d.add(userId);
      if (!acc.lastPlayAt || playedAt > acc.lastPlayAt) {
        acc.lastPlayAt = playedAt;
      }
    } else if (playedAt >= prevStart && playedAt < windowStart) {
      acc.playersPrev.add(userId);
    }
  }

  const ranked = [...byProject.entries()]
    .map(([id, acc]) => {
      const players7d = acc.players7d.size;
      const playersPrev7d = acc.playersPrev.size;
      const playerDelta7d = players7d - playersPrev7d;
      return {
        id,
        players7d,
        playersPrev7d,
        playerDelta7d,
        lastPlayAt: acc.lastPlayAt,
      };
    })
    .filter((row) => row.players7d >= 1 && row.playerDelta7d > 0)
    .sort((a, b) => {
      if (b.playerDelta7d !== a.playerDelta7d) {
        return b.playerDelta7d - a.playerDelta7d;
      }
      if (b.players7d !== a.players7d) return b.players7d - a.players7d;
      const aPlay = a.lastPlayAt ? Date.parse(a.lastPlayAt) : 0;
      const bPlay = b.lastPlayAt ? Date.parse(b.lastPlayAt) : 0;
      if (bPlay !== aPlay) return bPlay - aPlay;
      return a.id.localeCompare(b.id);
    });

  return ranked.map((row, index) => {
    const stub: HomeDiscoveryCard = {
      id: row.id,
      title: "",
      version: "0.1",
      description: "",
      image: "",
      updatedLabel: "",
      feedbackCount: 0,
      watchCount: 0,
      section: "trending",
      rank: index + 1,
      cardTimeAt: row.lastPlayAt,
      firstPublishedAt: null,
      meaningfulUpdateAt: null,
      lastEngagementAt: row.lastPlayAt,
      feedbackUsers7d: 0,
      watchers7d: 0,
      players7d: row.players7d,
    };
    return {
      id: row.id,
      featuredType: "rising_plays" as const,
      axisRank: index + 1,
      ownerId: ownerByProject[row.id] ?? null,
      card: stub,
      playersPrev7d: row.playersPrev7d,
      playerDelta7d: row.playerDelta7d,
      lastPlayAt: row.lastPlayAt,
    };
  });
}

async function enrichProjectCards(
  supabase: SupabaseClient,
  projectIds: string[],
): Promise<
  Record<
    string,
    {
      title: string;
      description: string;
      version: string;
      genre: string | null;
      ownerId: string | null;
      firstPublishedAt: string | null;
      feedbackCount: number;
      watchCount: number;
    }
  >
> {
  const unique = [...new Set(projectIds.filter(Boolean))];
  if (unique.length === 0) return {};

  const { data } = await supabase
    .from("projects")
    .select(
      "id, title, description, playable_version, genre, owner_id, first_published_at",
    )
    .in("id", unique)
    .eq("visibility", "public");

  const map: Record<
    string,
    {
      title: string;
      description: string;
      version: string;
      genre: string | null;
      ownerId: string | null;
      firstPublishedAt: string | null;
      feedbackCount: number;
      watchCount: number;
    }
  > = {};

  for (const row of (data ?? []) as {
    id: string;
    title?: string | null;
    description?: string | null;
    playable_version?: string | null;
    genre?: string | null;
    owner_id?: string | null;
    first_published_at?: string | null;
  }[]) {
    map[row.id] = {
      title: String(row.title ?? ""),
      description: String(row.description ?? ""),
      version: String(row.playable_version ?? "0.1"),
      genre: row.genre ?? null,
      ownerId: row.owner_id ?? null,
      firstPublishedAt: row.first_published_at ?? null,
      feedbackCount: 0,
      watchCount: 0,
    };
  }

  try {
    const { data: stats } = await supabase.rpc("get_public_project_stats", {
      p_project_ids: unique,
    });
    for (const s of (stats ?? []) as {
      project_id: string;
      feedback_participant_count?: number;
      watch_count?: number;
    }[]) {
      const entry = map[s.project_id];
      if (!entry) continue;
      entry.feedbackCount = Number(s.feedback_participant_count) || 0;
      entry.watchCount = Number(s.watch_count) || 0;
    }
  } catch {
    // stats optional in fallback
  }

  return map;
}

export async function buildHomeFeaturedHero(
  rpcClient: SupabaseClient,
  shelves: {
    trending: HomeDiscoveryCard[];
    updated: HomeDiscoveryCard[];
    newest: HomeDiscoveryCard[];
  },
  options?: {
    /** Client used only for play-session / enrich fallback (often service role). */
    composeClient?: SupabaseClient;
  },
): Promise<HomeFeaturedHeroCard[]> {
  const rpcRows = await fetchHomeFeaturedHero(rpcClient);
  if (rpcRows.length > 0) {
    return rpcRows
      .map(mapFeaturedHeroRowToCard)
      .filter((c): c is HomeFeaturedHeroCard => Boolean(c))
      .sort((a, b) => a.slotRank - b.slotRank);
  }

  const composeClient = options?.composeClient ?? rpcClient;

  const ownerByProject: Record<string, string | null> = {};
  for (const card of [
    ...shelves.trending,
    ...shelves.updated,
    ...shelves.newest,
  ]) {
    ownerByProject[card.id] = null;
  }

  const risingRaw = await fetchRisingPlayCandidates(
    composeClient,
    ownerByProject,
  );
  const enrichIds = [
    ...shelves.trending.map((c) => c.id),
    ...shelves.updated.map((c) => c.id),
    ...shelves.newest.map((c) => c.id),
    ...risingRaw.map((c) => c.id),
  ];
  const enriched = await enrichProjectCards(composeClient, enrichIds);

  const reaction: AxisCandidate[] = shelves.trending.map((card, index) => ({
    id: card.id,
    featuredType: "reaction" as const,
    axisRank: card.rank || index + 1,
    ownerId: enriched[card.id]?.ownerId ?? null,
    card: {
      ...card,
      title: card.title || enriched[card.id]?.title || card.title,
    },
  }));

  const rising: AxisCandidate[] = risingRaw.map((cand) => {
    const meta = enriched[cand.id];
    const card: HomeDiscoveryCard = {
      ...cand.card,
      title: meta?.title || cand.card.title || "作品",
      description: meta?.description || "",
      version: meta?.version || "0.1",
      genre: meta?.genre ?? undefined,
      firstPublishedAt: meta?.firstPublishedAt ?? null,
      feedbackCount: meta?.feedbackCount ?? 0,
      watchCount: meta?.watchCount ?? 0,
      image: cand.card.image || `/api/public/projects/${cand.id}/thumbnail`,
    };
    return {
      ...cand,
      ownerId: meta?.ownerId ?? cand.ownerId,
      card,
    };
  });

  const newest: AxisCandidate[] = shelves.newest.map((card, index) => ({
    id: card.id,
    featuredType: "newest" as const,
    axisRank: card.rank || index + 1,
    ownerId: enriched[card.id]?.ownerId ?? null,
    card,
  }));

  const updated: AxisCandidate[] = shelves.updated.map((card, index) => ({
    id: card.id,
    featuredType: "updated" as const,
    axisRank: card.rank || index + 1,
    ownerId: enriched[card.id]?.ownerId ?? null,
    card,
    updateKind: null,
  }));

  const picked = pickFeaturedHeroSlots({
    reaction,
    rising_plays: rising,
    newest,
    updated,
  });

  return picked.map((cand, index) =>
    cardToHero(cand.card, cand.featuredType, index + 1, cand.axisRank, {
      ownerId: cand.ownerId,
      playersPrev7d: cand.playersPrev7d,
      playerDelta7d: cand.playerDelta7d,
      lastPlayAt: cand.lastPlayAt,
      updateKind: cand.updateKind,
    }),
  );
}

export function featuredTypesPresent(
  hero: HomeFeaturedHeroCard[],
): FeaturedHeroType[] {
  return FEATURED_HERO_TYPE_ORDER.filter((type) =>
    hero.some((item) => item.featuredType === type),
  );
}
