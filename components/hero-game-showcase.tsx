"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { GameThumbnail } from "@/components/game-thumbnail";
import type { Game } from "@/lib/mock-games";
import { displayPhase } from "@/lib/development-phases";
import { LABEL_TEST_PLAY_OPEN } from "@/lib/user-labels";

type HeroGameShowcaseProps = {
  games: Game[];
  loading?: boolean;
};

function ShowcaseSkeleton() {
  return (
    <div className="relative w-full">
      <div className="aspect-[16/9] animate-pulse overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/60 sm:aspect-[2/1] lg:min-h-[320px]" />
      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="aspect-video animate-pulse rounded-xl border border-zinc-800/60 bg-zinc-900/50"
          />
        ))}
      </div>
    </div>
  );
}

export function HeroGameShowcase({ games, loading = false }: HeroGameShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const showcaseGames = games.slice(0, 5);
  const activeGame = showcaseGames[activeIndex] ?? showcaseGames[0];

  const goTo = useCallback(
    (index: number) => {
      if (showcaseGames.length === 0) {
        return;
      }
      setActiveIndex((index + showcaseGames.length) % showcaseGames.length);
    },
    [showcaseGames.length],
  );

  useEffect(() => {
    if (showcaseGames.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % showcaseGames.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [showcaseGames.length]);

  if (loading) {
    return <ShowcaseSkeleton />;
  }

  if (!activeGame || showcaseGames.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full lg:scale-[1.02] lg:origin-center">
      <div
        className="pointer-events-none absolute -inset-8 rounded-[2rem] opacity-50 blur-3xl"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(249,115,22,0.45), transparent 62%), radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.25), transparent 55%)",
        }}
      />

      <div className="relative">
        <Link
          href={`/games/${activeGame.id}`}
          className="group relative block overflow-hidden rounded-2xl border border-zinc-600/50 bg-zinc-950 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.85)] ring-1 ring-orange-500/30 transition-all duration-300 hover:border-orange-500/60 hover:ring-orange-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <GameThumbnail
            thumbnailUrl={activeGame.thumbnailUrl}
            status={activeGame.status}
            projectId={activeGame.id}
            title={activeGame.title}
            genre={activeGame.genre}
            phase={displayPhase(activeGame.phase)}
            aspectClassName="aspect-[16/9] min-h-[220px] sm:aspect-[2/1] sm:min-h-[280px] lg:min-h-[340px]"
            showStatus={false}
            featured
            overlayClassName="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-zinc-950/10 opacity-95"
          />

          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5" />

          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 lg:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-orange-400/50 bg-orange-500/20 px-3 py-1 text-xs font-bold tracking-wide text-orange-200 shadow-lg shadow-orange-950/40">
                FEATURED
              </span>
              {activeGame.lookingForTesters && (
                <span className="rounded-full border border-violet-500/40 bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-200">
                  {LABEL_TEST_PLAY_OPEN}
                </span>
              )}
            </div>
            <p className="mt-3 text-sm font-medium text-orange-300/80">{activeGame.genre}</p>
            <h2 className="mt-1 text-2xl font-bold leading-tight text-white drop-shadow-lg transition-colors group-hover:text-orange-200 sm:text-3xl lg:text-4xl">
              {activeGame.title}
            </h2>
            <p className="mt-2 line-clamp-2 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
              {activeGame.description}
            </p>
            <p className="mt-4 text-sm font-semibold text-orange-400 opacity-0 transition-opacity group-hover:opacity-100">
              詳細を見る →
            </p>
          </div>
        </Link>

        {showcaseGames.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              aria-label="前の作品"
              className="absolute left-3 top-[38%] z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-600/80 bg-zinc-950/80 text-zinc-300 backdrop-blur-sm transition-colors hover:border-orange-500/50 hover:text-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              aria-label="次の作品"
              className="absolute right-3 top-[38%] z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-600/80 bg-zinc-950/80 text-zinc-300 backdrop-blur-sm transition-colors hover:border-orange-500/50 hover:text-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              ›
            </button>
          </>
        )}
      </div>

      {showcaseGames.length > 1 && (
        <>
          <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-3">
            {showcaseGames.map((game, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`${game.title}を表示`}
                  aria-pressed={isActive}
                  className={`group/thumb relative overflow-hidden rounded-xl border text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                    isActive
                      ? "scale-[1.02] border-orange-500 shadow-lg shadow-orange-950/50 ring-2 ring-orange-500/50"
                      : "border-zinc-700/80 opacity-70 hover:border-zinc-500 hover:opacity-100"
                  } ${index === 4 ? "hidden sm:block" : ""}`}
                >
                  <GameThumbnail
                    thumbnailUrl={game.thumbnailUrl}
                    status={game.status}
                    projectId={game.id}
                    title={game.title}
                    genre={game.genre}
                    phase={displayPhase(game.phase)}
                    aspectClassName="aspect-video"
                    showStatus={false}
                    overlayClassName="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent opacity-60"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950 to-transparent px-2 pb-1.5 pt-5">
                    <p className="truncate text-[10px] font-semibold text-zinc-100 sm:text-xs">
                      {game.title}
                    </p>
                  </div>
                  {isActive && (
                    <div className="absolute left-0 top-0 h-0.5 w-full bg-gradient-to-r from-orange-500 to-amber-400" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex justify-center gap-1.5">
            {showcaseGames.map((game, index) => (
              <button
                key={game.id}
                type="button"
                aria-label={`${game.title}に移動`}
                onClick={() => goTo(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeIndex
                    ? "w-6 bg-orange-500"
                    : "w-1.5 bg-zinc-600 hover:bg-zinc-500"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
