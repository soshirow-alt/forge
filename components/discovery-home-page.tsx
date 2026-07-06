"use client";

import { HorizontalCardPager } from "@/components/horizontal-card-pager";
import { DiscoveryGameThumbnail } from "@/components/discovery-game-thumbnail";
import { DiscoveryCardStatPills } from "@/components/discovery-card-stat-pills";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useGames } from "@/components/games-provider";
import { DiscoveryHomeSkeleton } from "@/components/forge-loading-skeletons";
import { useForgePerfRoute } from "@/hooks/use-forge-perf-route";
import { GeneratedThumbnailPoster } from "@/components/generated-thumbnail-poster";
import { useHideV0MockContent } from "@/lib/forge-deployment-context";
import {
  gameToHomeCard,
  mergeHomeCards,
  sortGamesByNewest,
  sortGamesByUpdated,
} from "@/lib/discovery-public-games";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import {
  heroSlides,
  newGames,
  popularGames,
  recentlyUpdatedGames,
  type HomeGameCard,
} from "@/lib/home-v0-mock-data";
import { ChevronLeft, ChevronRight } from "lucide-react";

function HorizontalGameCard({
  game,
  rank,
  compact = false,
}: {
  game: HomeGameCard;
  rank?: number;
  compact?: boolean;
}) {
  return (
    <Link href={gameDetailHref(game.id)} className="block w-full">
      <article>
      <div className="relative">
        {rank !== undefined && (
          <span className={`absolute left-1.5 top-1.5 z-10 flex items-center justify-center rounded-md bg-violet-600 font-bold text-white shadow-lg ${
            compact ? "size-6 text-xs" : "left-2 top-2 size-7 text-sm"
          }`}>
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
      <h3 className={`truncate font-semibold text-white ${compact ? "mt-2 text-sm" : "mt-3"}`}>
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
        <Link href={href} className="text-sm text-violet-400 transition-colors hover:text-violet-300">
          すべて見る →
        </Link>
      )}
    </div>
  );
}

function HeroCarousel({ slides }: { slides: HomeGameCard[] }) {
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
            注目の開発中ゲーム
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
            key={item.id}
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

export function DiscoveryHomePage() {
  const { publicGames, publicCatalogReady, getPublicProjectStats, getSupportCount } =
    useGames();
  const hideV0Mock = useHideV0MockContent();

  useForgePerfRoute({
    route: "/home",
    ready: publicCatalogReady,
    context: { gameCount: publicGames.length },
  });

  const cardStatsFor = useMemo(
    () => (gameId: string) => {
      const stats = getPublicProjectStats(gameId);
      return {
        feedbackParticipantCount: stats.feedbackParticipantCount,
        watchCount: stats.watchCount,
      };
    },
    [getPublicProjectStats],
  );

  const realNewGames = useMemo(
    () =>
      sortGamesByNewest(publicGames).map((game) =>
        gameToHomeCard(game, cardStatsFor(game.id)),
      ),
    [publicGames, cardStatsFor],
  );

  const realUpdatedGames = useMemo(
    () =>
      sortGamesByUpdated(publicGames).map((game) =>
        gameToHomeCard(game, cardStatsFor(game.id)),
      ),
    [publicGames, cardStatsFor],
  );

  const heroItems = useMemo(() => {
    const primary = realUpdatedGames.slice(0, 3);
    if (hideV0Mock) {
      return primary;
    }
    return mergeHomeCards(primary, heroSlides, false);
  }, [realUpdatedGames, hideV0Mock]);

  const newItems = useMemo(() => {
    if (hideV0Mock) {
      return realNewGames;
    }
    return mergeHomeCards(realNewGames, newGames, false);
  }, [realNewGames, hideV0Mock]);

  const updatedItems = useMemo(() => {
    if (hideV0Mock) {
      return realUpdatedGames;
    }
    return mergeHomeCards(realUpdatedGames, recentlyUpdatedGames, false);
  }, [realUpdatedGames, hideV0Mock]);

  const popularItems = useMemo(() => {
    const realPopular = [...publicGames]
      .sort((a, b) => getSupportCount(b.id) - getSupportCount(a.id))
      .map((game) => gameToHomeCard(game, cardStatsFor(game.id)));
    if (hideV0Mock) {
      return realPopular;
    }
    return mergeHomeCards(realPopular, popularGames, false);
  }, [publicGames, getSupportCount, cardStatsFor, hideV0Mock]);

  if (!publicCatalogReady) {
    return <DiscoveryHomeSkeleton />;
  }

  return (
    <div className="space-y-10">
        {heroItems.length > 0 ? (
          <HeroCarousel slides={heroItems} />
        ) : (
          <DiscoverySectionEmpty message="まだ公開中の作品がありません" />
        )}

        <section>
          <SectionHeader title="最近更新された作品" href="/search" />
          {updatedItems.length > 0 ? (
            <div className="mt-4 px-2">
              <HorizontalCardPager
                items={updatedItems}
                getKey={(game) => game.id}
                pageSize={4}
                renderItem={(game) => <HorizontalGameCard game={game} compact />}
              />
            </div>
          ) : (
            <DiscoverySectionEmpty message="更新された作品はまだありません" />
          )}
        </section>

        <section>
          <SectionHeader title="今週人気の作品" href="/search" />
          {popularItems.length > 0 ? (
            <div className="mt-4 px-2">
              <HorizontalCardPager
                items={popularItems.map((game, index) => ({ game, rank: index + 1 }))}
                getKey={({ game }) => game.id}
                pageSize={4}
                renderItem={({ game, rank }) => (
                  <HorizontalGameCard game={game} rank={rank} compact />
                )}
              />
            </div>
          ) : (
            <DiscoverySectionEmpty message="人気の作品はまだありません" />
          )}
        </section>

        <section>
          <SectionHeader title="新着作品" href="/search" />
          {newItems.length > 0 ? (
            <div className="mt-4 px-2">
              <HorizontalCardPager
                items={newItems}
                getKey={(game) => game.id}
                pageSize={4}
                renderItem={(game) => <HorizontalGameCard game={game} compact />}
              />
            </div>
          ) : (
            <DiscoverySectionEmpty message="新着作品はまだありません" />
          )}
        </section>
    </div>
  );
}
