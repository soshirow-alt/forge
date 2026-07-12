"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DiscoveryCardStatPills } from "@/components/discovery-card-stat-pills";
import { DiscoveryGameThumbnail } from "@/components/discovery-game-thumbnail";
import {
  FeaturedGameCarousel,
  type FeaturedThumbnailsState,
} from "@/components/featured/featured-game-carousel";
import { HorizontalCardPager } from "@/components/horizontal-card-pager";
import {
  buildSectionCarouselItems,
  selectHeroItems,
} from "@/lib/home-discovery-selection";
import {
  fetchHomeDiscoveryFeed,
  fetchPublicProjectThumbnailUrlsByIds,
  type HomeDiscoveryCard,
} from "@/lib/supabase/home-discovery-db";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import { useForgePerfRoute } from "@/hooks/use-forge-perf-route";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";

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
          <DiscoveryGameThumbnail
            id={game.id}
            title={game.title}
            genre={game.genre}
            version={game.version}
            image={game.image}
            className="aspect-[4/3] w-full"
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

async function loadHomeDiscoveryFeedWithRetry(
  supabase: NonNullable<ReturnType<typeof getOptionalSupabaseClient>>,
) {
  try {
    return await fetchHomeDiscoveryFeed(supabase);
  } catch (firstError) {
    // One retry covers transient cold-start / network blips without flashing error.
    await new Promise((resolve) => setTimeout(resolve, 250));
    try {
      return await fetchHomeDiscoveryFeed(supabase);
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
    const supabase = getOptionalSupabaseClient();

    void (async () => {
      // Keep loading UI until a definitive success or failure — never flash error mid-fetch.
      // Cached feed already shown; still revalidate in background.
      if (!supabase) {
        if (cancelled) return;
        setState({ status: "ready", feed: EMPTY_FEED, error: null });
        setHeroThumbnails({ status: "error" });
        return;
      }

      try {
        const next = await loadHomeDiscoveryFeedWithRetry(supabase);
        if (cancelled) return;
        homeDiscoveryFeedCache = next;
        setState({ status: "ready", feed: next, error: null });

        const heroIds = selectHeroItems(
          next.trending,
          next.updated,
          next.newest,
        ).map((item) => item.id);

        if (heroIds.length === 0) {
          setHeroThumbnails({ status: "ready", byId: {} });
          return;
        }

        setHeroThumbnails({ status: "loading" });
        try {
          const byId = await fetchPublicProjectThumbnailUrlsByIds(
            supabase,
            heroIds,
          );
          if (cancelled) return;
          setHeroThumbnails({ status: "ready", byId });
        } catch {
          if (cancelled) return;
          // Do not cache failure as empty success.
          setHeroThumbnails({ status: "error" });
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

  const heroIds = useMemo(
    () => new Set(heroItems.map((item) => item.id)),
    [heroItems],
  );

  const updatedCarousel = useMemo(
    () => (feed ? buildSectionCarouselItems(feed.updated, heroIds, 4) : []),
    [feed, heroIds],
  );
  const trendingCarousel = useMemo(
    () => (feed ? buildSectionCarouselItems(feed.trending, heroIds, 4) : []),
    [feed, heroIds],
  );
  /** 新着はヒーロー除外なし — RPC の first_published_at DESC（rank）順をそのまま使う */
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
