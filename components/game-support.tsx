"use client";

import { useGames } from "@/components/games-provider";

type GameSupportProps = {
  gameId: string;
  isUserSubmitted: boolean;
};

export function GameSupport({ gameId, isUserSubmitted }: GameSupportProps) {
  const { getSupportCount, incrementSupportCount } = useGames();
  const defaultCount = isUserSubmitted ? 0 : 124;
  const count = getSupportCount(gameId, defaultCount);

  function handleSupport() {
    incrementSupportCount(gameId, defaultCount);
  }

  return (
    <div className="mt-8 border-t border-zinc-800 pt-8">
      <p className="text-lg text-zinc-300">
        <span aria-hidden="true">❤ </span>
        {count}人が応援中
      </p>
      <button
        type="button"
        onClick={handleSupport}
        className="mt-4 w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 text-lg font-semibold text-zinc-950 transition-opacity hover:opacity-90 sm:w-auto"
      >
        応援する
      </button>
    </div>
  );
}
