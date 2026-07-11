"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DiscoveryCardStatPills } from "@/components/discovery-card-stat-pills";
import { DiscoveryGameThumbnail } from "@/components/discovery-game-thumbnail";
import { GeneratedThumbnailPoster } from "@/components/generated-thumbnail-poster";
import { HorizontalCardPager } from "@/components/horizontal-card-pager";
import {
  buildSectionCarouselItems,
  selectHeroItems,
} from "@/lib/home-discovery-selection";
import {
  fetchHomeDiscoveryFeed,
  type HomeDiscoveryCard,
} from "@/lib/supabase/home-discovery-db";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import { useForgePerfRoute } from "@/hooks/use-forge-perf-route";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";

function HorizontalGameCard({
  game,
  rank,
  compact = false,
}: {
  game: HomeDiscoveryCard;
  rank?: number;
  compact?: boolean;
}) {
  return (
    <Link href={gameDetailHref(game.id)} className="block w-full">
      <article>
        <div className="relative">
          {rank !== undefined && (
            <span
              className={`absolute left-1.5 top-1.5 z-10 flex items-center justify-center rounded-md bg-violet-600 font-bold text-white shadow-lg ${
                compact ? "size-6 text-xs" : "left-2 top-2 size-7 text-sm"
              }`}
            >
              {rank}
            </span>
          )}
          <DiscoveryGameThumbnail
            id={game.id}
            title={game.title}
            genre={game.genre}
            version={game.version}
            image={game.image}
            className="w-full aspect-[4/3]"
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
      {href && (
        <Link
          href={href}
          className="text-sm text-violet-400 transition-colors hover:text-violet-300"
        >
          すべて見る →
        </Link>
      )}
    </div>
  );
}

function HeroCarousel({ slides }: { slides: HomeDiscoveryCard[] }) {
  const [index, setIndex] = useState(0);
  const slide = slides[index] ?? slides[0];

  if (!slide) {
    return null;
  }

  function goPrev() {
    setIndex((current) => (current === 0 ? slides.length - 1 : current - 1));
  }

  function goNext() {
    setIndex((current) => (current === slides.length - 1 ? 0 : current + 1));
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
      <div className="relative min-h-[280px] sm:min-h-[320px]">
        {slide.image ? (
          <Image
            src={slide.image}
            alt=""
            fill
            className="object-cover opacity-50"
            priority
          />
        ) : (
          <div className="absolute inset-0 opacity-50">
            <GeneratedThumbnailPoster
              projectId={slide.id}
              title={slide.title}
              genre={slide.genre ?? ""}
              phase={slide.version}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-transparent to-transparent" />

        <div className="relative flex h-full flex-col justify-end p-6 sm:p-8 lg:max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wider text-violet-400">
            注目の作品
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-4xl">
            {slide.title}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {slide.version} · {slide.updatedLabel}
          </p>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-300">
            {slide.description}
          </p>
          <div className="mt-4">
            <DiscoveryCardStatPills
              feedbackCount={slide.feedbackCount}
              watchCount={slide.watchCount}
            />
          </div>
          <Link
            href={gameDetailHref(slide.id)}
            className="mt-6 inline-flex w-fit rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
          >
            詳しく見る →
          </Link>
        </div>

        <button
          type="button"
          onClick={goPrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-zinc-700/80 bg-zinc-950/80 p-2 text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
          aria-label="前のスライド"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={goNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-zinc-700/80 bg-zinc-950/80 p-2 text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
          aria-label="次のスライド"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="flex justify-center gap-2 border-t border-zinc-800/80 py-3">
        {slides.map((item, dotIndex) => (
          <button
            key={`${item.id}-${item.heroSource ?? "hero"}`}
            type="button"
            onClick={() => setIndex(dotIndex)}
            className={`size-2 rounded-full transition-colors ${
              dotIndex === index ? "bg-violet-500" : "bg-zinc-700 hover:bg-zinc-500"
            }`}
            aria-label={`スライド ${dotIndex + 1}`}
          />
        ))}
      </div>
    </section>
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
      <div className="aspect-[21/9] animate-pulse rounded-2xl bg-zinc-800/70" />
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
  const [state, setState] = useState<FeedState>({
    status: "loading",
    feed: null,
    error: null,
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
      if (!supabase) {
        if (cancelled) return;
        setState({ status: "ready", feed: EMPTY_FEED, error: null });
        return;
      }

      try {
        const next = await loadHomeDiscoveryFeedWithRetry(supabase);
        if (cancelled) return;
        setState({ status: "ready", feed: next, error: null });
      } catch (err: unknown) {
        if (cancelled) return;
        setState({
          status: "error",
          feed: EMPTY_FEED,
          error: err instanceof Error ? err.message : "feed load failed",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const heroItems = useMemo(() => {
    if (!feed) return [];
    return selectHeroItems(feed.trending, feed.updated, feed.newest).map(
      (item) => {
        // Keep the label/time from the discovery axis that won the hero slot.
        return item;
      },
    );
  }, [feed]);

  const heroIds = useMemo(
    () => new Set(heroItems.map((item) => item.id)),
    [heroItems],
  );

  const updatedCarousel = useMemo(
    () =>
      feed ? buildSectionCarouselItems(feed.updated, heroIds, 4) : [],
    [feed, heroIds],
  );
  const trendingCarousel = useMemo(
    () =>
      feed ? buildSectionCarouselItems(feed.trending, heroIds, 4) : [],
    [feed, heroIds],
  );
  const newestCarousel = useMemo(
    () =>
      feed ? buildSectionCarouselItems(feed.newest, heroIds, 4) : [],
    [feed, heroIds],
  );

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
        <HeroCarousel slides={heroItems} />
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
              items={trendingCarousel.map((game) => ({
                game,
                rank: game.rank,
              }))}
              getKey={({ game }) => `${game.id}-trending-${game.rank}`}
              pageSize={4}
              renderItem={({ game, rank }) => (
                <HorizontalGameCard game={game} rank={rank} compact />
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
