"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DiscoveryCardStatPills } from "@/components/discovery-card-stat-pills";
import {
  FeaturedGameCarousel,
  type FeaturedThumbnailsState,
} from "@/components/featured/featured-game-carousel";
import { HorizontalCardPager } from "@/components/horizontal-card-pager";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import {
  selectHeroItems,
} from "@/lib/home-discovery-selection";
import {
  fetchHomeDiscoveryFeedFromApi,
  type HomeDiscoveryCard,
} from "@/lib/supabase/home-discovery-db";
import { publicProjectThumbnailPaths } from "@/lib/public-project-thumbnail";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import { useForgePerfRoute } from "@/hooks/use-forge-perf-route";

/** Hero UI uses cover + 2 extra slots only. */
const HERO_THUMBNAIL_PATH_LIMIT = 3;

async function fetchHeroThumbnailPathsById(
  heroIds: string[],
): Promise<Record<string, string[]>> {
  const ids = heroIds.filter(Boolean).slice(0, HERO_THUMBNAIL_PATH_LIMIT);
  const byId: Record<string, string[]> = {};
  if (ids.length === 0) {
    return byId;
  }

  const response = await fetch(
    `/api/public/projects/thumbnail-counts?ids=${ids.map(encodeURIComponent).join(",")}`,
    { method: "GET", cache: "no-store", credentials: "same-origin" },
  );
  if (!response.ok) {
    throw new Error(`hero thumbnail counts failed (${response.status})`);
  }
  const payload = (await response.json()) as {
    ok?: boolean;
    counts?: Record<string, number>;
  };
  if (!payload.ok || !payload.counts) {
    throw new Error("hero thumbnail counts failed");
  }

  for (const id of ids) {
    const count = payload.counts[id] ?? 0;
    byId[id] = publicProjectThumbnailPaths(
      id,
      Math.min(HERO_THUMBNAIL_PATH_LIMIT, count),
    );
  }
  return byId;
}

function HorizontalGameCard({
  game,
  compact = false,
}: {
  game: HomeDiscoveryCard;
  compact?: boolean;
}) {
  return (
    <Link href={gameDetailHref(game.id)} className="block w-full">
      <article>
        <div className="relative">
          <ProjectThumbnail
            projectId={game.id}
            title={game.title}
            genre={game.genre}
            version={game.version}
            variant="card"
            className="rounded-xl"
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 360px"
          />
        </div>
        <h3
          className={`truncate font-semibold text-white ${compact ? "mt-2 text-sm" : "mt-3"}`}
        >
          {game.title}
        </h3>
        <p className="mt-0.5 text-xs text-zinc-500">
          {game.version} · {game.updatedLabel}
        </p>
        <div className={compact ? "mt-1.5" : "mt-2"}>
          <DiscoveryCardStatPills
            feedbackCount={game.feedbackCount}
            watchCount={game.watchCount}
            compact={compact}
          />
        </div>
      </article>
    </Link>
  );
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-white sm:text-xl">{title}</h2>
      {href ? (
        <Link
          href={href}
          className="text-sm text-violet-400 transition-colors hover:text-violet-300"
        >
          すべて見る →
        </Link>
      ) : null}
    </div>
  );
}

function DiscoverySectionEmpty({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
      {message}
    </div>
  );
}

function DiscoveryHomeSkeleton() {
  return (
    <div className="space-y-10">
      <div>
        <div className="mb-4 h-7 w-40 animate-pulse rounded bg-zinc-800/70" />
        <div className="mx-auto h-[240px] w-full max-w-[1000px] animate-pulse rounded-xl bg-zinc-800/70 sm:h-[280px] md:h-[350px]" />
      </div>
      {[0, 1, 2].map((section) => (
        <section key={section}>
          <div className="flex items-center justify-between">
            <div className="h-6 w-40 animate-pulse rounded bg-zinc-800/70" />
            <div className="h-4 w-16 animate-pulse rounded bg-zinc-800/50" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((card) => (
              <div key={card} className="space-y-2">
                <div className="aspect-[4/3] animate-pulse rounded-xl bg-zinc-800/70" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800/60" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-800/50" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

type FeedState =
  | { status: "loading"; feed: null; error: null }
  | {
      status: "ready";
      feed: {
        newest: HomeDiscoveryCard[];
        updated: HomeDiscoveryCard[];
        trending: HomeDiscoveryCard[];
      };
      error: null;
    }
  | {
      status: "error";
      feed: {
        newest: HomeDiscoveryCard[];
        updated: HomeDiscoveryCard[];
        trending: HomeDiscoveryCard[];
      };
      error: string;
    };

const EMPTY_FEED = {
  newest: [] as HomeDiscoveryCard[],
  updated: [] as HomeDiscoveryCard[],
  trending: [] as HomeDiscoveryCard[],
};

/** Client remount 時に前回成功分を即表示し、裏で再検証する */
let homeDiscoveryFeedCache: {
  newest: HomeDiscoveryCard[];
  updated: HomeDiscoveryCard[];
  trending: HomeDiscoveryCard[];
} | null = null;

async function loadHomeDiscoveryFeedWithRetry() {
  try {
    return await fetchHomeDiscoveryFeedFromApi();
  } catch (firstError) {
    // One retry covers transient cold-start / network blips without flashing error.
    await new Promise((resolve) => setTimeout(resolve, 250));
    try {
      return await fetchHomeDiscoveryFeedFromApi();
    } catch {
      throw firstError;
    }
  }
}

export function DiscoveryHomePage() {
  const [state, setState] = useState<FeedState>(() =>
    homeDiscoveryFeedCache
      ? { status: "ready", feed: homeDiscoveryFeedCache, error: null }
      : { status: "loading", feed: null, error: null },
  );
  const [heroThumbnails, setHeroThumbnails] = useState<FeaturedThumbnailsState>({
    status: "loading",
  });
  const feed = state.feed;
  const ready = state.status !== "loading";
  const error = state.status === "error" ? state.error : null;

  useForgePerfRoute({
    route: "/home",
    ready,
    context: {
      newest: feed?.newest.length ?? 0,
      updated: feed?.updated.length ?? 0,
      trending: feed?.trending.length ?? 0,
    },
  });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      // Keep loading UI until a definitive success or failure — never flash error mid-fetch.
      // Cached feed already shown; still revalidate in background.
      try {
        const next = await loadHomeDiscoveryFeedWithRetry();
        if (cancelled) return;
        homeDiscoveryFeedCache = next;
        // Feed ready first — hero cover uses slide.image; extras stay loading
        // until counts arrive (do not block first paint on extras).
        setState({ status: "ready", feed: next, error: null });
        setHeroThumbnails({ status: "loading" });

        const heroes = selectHeroItems(
          next.trending,
          next.updated,
          next.newest,
        );
        try {
          const byId = await fetchHeroThumbnailPathsById(
            heroes.map((hero) => hero.id),
          );
          if (cancelled) return;
          setHeroThumbnails({ status: "ready", byId });
        } catch {
          if (cancelled) return;
          // Cover-only fallback; extras correctly show 未登録 if count unknown.
          const byId: Record<string, string[]> = {};
          for (const hero of heroes) {
            byId[hero.id] = hero.image ? [hero.image] : [];
          }
          setHeroThumbnails({ status: "ready", byId });
        }
      } catch (err: unknown) {
        if (cancelled) return;
        // Keep previous successful feed if revalidation fails.
        if (homeDiscoveryFeedCache) {
          setState({
            status: "ready",
            feed: homeDiscoveryFeedCache,
            error: null,
          });
          return;
        }
        setState({
          status: "error",
          feed: EMPTY_FEED,
          error: err instanceof Error ? err.message : "feed load failed",
        });
        setHeroThumbnails({ status: "error" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const heroItems = useMemo(() => {
    if (!feed) return [];
    return selectHeroItems(feed.trending, feed.updated, feed.newest);
  }, [feed]);

  /** RPC 順のまま表示（ヒーローとの重複を許可。除外・並べ替えなし） */
  const updatedCarousel = useMemo(() => feed?.updated ?? [], [feed]);
  const trendingCarousel = useMemo(() => feed?.trending ?? [], [feed]);
  const newestCarousel = useMemo(() => feed?.newest ?? [], [feed]);

  if (!ready) {
    return <DiscoveryHomeSkeleton />;
  }

  return (
    <div className="space-y-10">
      {error ? (
        <p className="rounded-xl border border-amber-800/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
          ホームの発見データを読み込めませんでした。しばらくしてから再度お試しください。
        </p>
      ) : null}

      {heroItems.length > 0 ? (
        <FeaturedGameCarousel
          slides={heroItems}
          thumbnails={heroThumbnails}
        />
      ) : error ? null : (
        <DiscoverySectionEmpty message="まだ公開中の作品がありません" />
      )}

      {updatedCarousel.length > 0 ? (
        <section>
          <SectionHeader title="最近更新された作品" href="/search" />
          <div className="mt-4 px-2">
            <HorizontalCardPager
              items={updatedCarousel}
              getKey={(game) => `${game.id}-updated-${game.rank}`}
              pageSize={4}
              renderItem={(game) => (
                <HorizontalGameCard game={game} compact />
              )}
            />
          </div>
        </section>
      ) : null}

      {trendingCarousel.length > 0 ? (
        <section>
          <SectionHeader title="直近7日で反応が集まった作品" href="/search" />
          <div className="mt-4 px-2">
            <HorizontalCardPager
              items={trendingCarousel}
              getKey={(game) => `${game.id}-trending-${game.rank}`}
              pageSize={4}
              renderItem={(game) => (
                <HorizontalGameCard game={game} compact />
              )}
            />
          </div>
        </section>
      ) : null}

      {newestCarousel.length > 0 ? (
        <section>
          <SectionHeader title="新着作品" href="/search" />
          <div className="mt-4 px-2">
            <HorizontalCardPager
              items={newestCarousel}
              getKey={(game) => `${game.id}-newest-${game.rank}`}
              pageSize={4}
              renderItem={(game) => (
                <HorizontalGameCard game={game} compact />
              )}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
