"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
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

type HeroThumbnailsState =
  | { status: "loading" }
  | { status: "ready"; byId: Record<string, string[]> }
  | { status: "error" };

function MissingGameImage() {
  return (
    <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-black text-center">
      <div className="space-y-1 text-zinc-600">
        <ImageIcon className="mx-auto size-5" aria-hidden="true" />
        <p className="text-[11px] font-medium">追加画像未登録</p>
      </div>
    </div>
  );
}

function LoadingGameImageSlot() {
  return (
    <div
      className="aspect-[4/3] animate-pulse rounded-xl border border-zinc-800/80 bg-zinc-900/80"
      aria-hidden="true"
    />
  );
}

function GameImageThumbnail({
  src,
  selected,
  onSelect,
}: {
  src: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative aspect-[4/3] overflow-hidden rounded-xl border bg-black transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet-500/70 ${
        selected
          ? "border-violet-500/70 ring-1 ring-violet-500/40"
          : "border-zinc-800 hover:border-violet-500/40"
      }`}
      aria-pressed={selected}
      aria-label="追加画像をメインに表示"
    >
      <Image src={src} alt="" fill className="object-contain" sizes="160px" />
    </button>
  );
}

function HeroCarousel({
  slides,
  thumbnails,
}: {
  slides: HomeDiscoveryCard[];
  thumbnails: HeroThumbnailsState;
}) {
  const [index, setIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const slide = slides[index] ?? slides[0];

  const galleryUrls = useMemo(() => {
    if (!slide) {
      return [] as string[];
    }
    if (thumbnails.status === "ready") {
      const fromDb = thumbnails.byId[slide.id];
      if (fromDb && fromDb.length > 0) {
        return fromDb;
      }
    }
    return slide.image ? [slide.image] : [];
  }, [slide, thumbnails]);

  const currentImage = galleryUrls[imageIndex] ?? galleryUrls[0] ?? null;
  const additionalSlots: Array<string | null | "loading"> = [0, 1].map((slot) => {
    if (thumbnails.status === "loading") {
      return "loading";
    }
    // ready or error: slot 0/1 map to gallery index 1/2 (additional only)
    return galleryUrls[slot + 1] ?? null;
  });

  if (!slide) {
    return null;
  }

  function goPrev() {
    setIndex((current) => (current === 0 ? slides.length - 1 : current - 1));
    setImageIndex(0);
  }

  function goNext() {
    setIndex((current) => (current === slides.length - 1 ? 0 : current + 1));
    setImageIndex(0);
  }

  function goToSlide(nextIndex: number) {
    setIndex(nextIndex);
    setImageIndex(0);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,68%)_minmax(0,32%)]">
        <div className="relative flex min-h-[220px] items-center justify-center bg-black sm:min-h-[280px] lg:min-h-[320px]">
          {currentImage ? (
            <Image
              src={currentImage}
              alt=""
              fill
              className="object-contain"
              priority
              sizes="(max-width: 1024px) 100vw, 70vw"
            />
          ) : (
            <GeneratedThumbnailPoster
              projectId={slide.id}
              title={slide.title}
              genre={slide.genre ?? ""}
              phase={slide.version}
            />
          )}

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

        <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5 lg:p-6">
          <div className="grid grid-cols-2 gap-3">
            {additionalSlots.map((slot, slotIndex) => {
              if (slot === "loading") {
                return <LoadingGameImageSlot key={`loading-${slotIndex}`} />;
              }
              if (typeof slot === "string") {
                return (
                  <GameImageThumbnail
                    key={`${slide.id}-extra-${slotIndex}`}
                    src={slot}
                    selected={currentImage === slot}
                    onSelect={() => setImageIndex(slotIndex + 1)}
                  />
                );
              }
              return <MissingGameImage key={`missing-${slotIndex}`} />;
            })}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-violet-400">
              注目の作品
            </p>
            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {slide.title}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              {slide.version} · {slide.updatedLabel}
            </p>
            <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-zinc-300">
              {slide.description}
            </p>
            <div className="mt-4">
              <DiscoveryCardStatPills
                feedbackCount={slide.feedbackCount}
                watchCount={slide.watchCount}
              />
            </div>
          </div>

          <Link
            href={gameDetailHref(slide.id)}
            className="inline-flex w-fit rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
          >
            詳しく見る →
          </Link>
        </div>
      </div>

      <div className="flex justify-center gap-2 border-t border-zinc-800/80 py-3">
        {slides.map((item, dotIndex) => (
          <button
            key={`${item.id}-${item.heroSource ?? "hero"}`}
            type="button"
            onClick={() => goToSlide(dotIndex)}
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
  const [heroThumbnails, setHeroThumbnails] = useState<HeroThumbnailsState>({
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
          setState({ status: "ready", feed: homeDiscoveryFeedCache, error: null });
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
        <HeroCarousel slides={heroItems} thumbnails={heroThumbnails} />
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
