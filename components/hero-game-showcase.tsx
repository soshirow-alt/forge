"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { GameThumbnail } from "@/components/game-thumbnail";
import type { Game } from "@/lib/mock-games";

type HeroGameShowcaseProps = {
  games: Game[];
  loading?: boolean;
};

function ShowcaseSkeleton() {
  return (
    <div className="relative w-full">
      <div className="aspect-[16/10] animate-pulse overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/60 sm:aspect-[5/3]" />
      <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="aspect-video animate-pulse rounded-lg border border-zinc-800/60 bg-zinc-900/50"
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
      setActiveIndex(index % showcaseGames.length);
    },
    [showcaseGames.length],
  );

  useEffect(() => {
    if (showcaseGames.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % showcaseGames.length);
    }, 5500);

    return () => window.clearInterval(timer);
  }, [showcaseGames.length]);

  if (loading) {
    return <ShowcaseSkeleton />;
  }

  if (!activeGame || showcaseGames.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full">
      <div
        className="pointer-events-none absolute -inset-6 rounded-3xl opacity-40 blur-3xl"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse at 60% 40%, rgba(249,115,22,0.35), transparent 65%), radial-gradient(ellipse at 30% 70%, rgba(99,102,241,0.2), transparent 60%)",
        }}
      />

      <Link
        href={`/games/${activeGame.id}`}
        className="group relative block overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-900/80 shadow-2xl shadow-black/40 ring-1 ring-orange-500/20 transition-all duration-300 hover:border-orange-500/50 hover:ring-orange-500/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
      >
        <GameThumbnail
          thumbnailUrl={activeGame.thumbnailUrl}
          status={activeGame.status}
          projectId={activeGame.id}
          title={activeGame.title}
          genre={activeGame.genre}
          phase={activeGame.phase}
          aspectClassName="aspect-[16/10] sm:aspect-[5/3]"
          showStatus={false}
          featured
          overlayClassName="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-90"
        />

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-orange-500/40 bg-orange-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-orange-300">
              注目作品
            </span>
            {activeGame.lookingForTesters && (
              <span className="rounded-full border border-violet-500/35 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-violet-300">
                テスター募集中
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-zinc-400">{activeGame.genre}</p>
          <h2 className="mt-1 text-2xl font-bold leading-tight text-zinc-50 transition-colors group-hover:text-orange-300 sm:text-3xl">
            {activeGame.title}
          </h2>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-400">
            {activeGame.description}
          </p>
        </div>
      </Link>

      {showcaseGames.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:mt-4 sm:grid-cols-5 sm:gap-3">
          {showcaseGames.map((game, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={game.id}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`${game.title}を表示`}
                aria-pressed={isActive}
                className={`group/thumb relative overflow-hidden rounded-lg border text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                  isActive
                    ? "border-orange-500/70 ring-2 ring-orange-500/40"
                    : "border-zinc-800/80 opacity-75 hover:border-zinc-600 hover:opacity-100"
                } ${index === 4 ? "hidden sm:block" : ""}`}
              >
                <GameThumbnail
                  thumbnailUrl={game.thumbnailUrl}
                  status={game.status}
                  projectId={game.id}
                  title={game.title}
                  genre={game.genre}
                  phase={game.phase}
                  aspectClassName="aspect-video"
                  showStatus={false}
                  overlayClassName="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/70 to-transparent opacity-50"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950/90 to-transparent px-2 pb-1.5 pt-6">
                  <p className="truncate text-[10px] font-semibold text-zinc-200 sm:text-xs">
                    {game.title}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
