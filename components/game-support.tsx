"use client";

import { useGames } from "@/components/games-provider";
import { getDefaultSupportCount } from "@/lib/demo-activity";

type GameSupportProps = {
  gameId: string;
  isUserSubmitted: boolean;
  compact?: boolean;
};

export function GameSupport({
  gameId,
  isUserSubmitted,
  compact = false,
}: GameSupportProps) {
  const { getSupportCount, incrementSupportCount } = useGames();
  const defaultCount = getDefaultSupportCount(gameId, isUserSubmitted);
  const count = getSupportCount(gameId, defaultCount);

  function handleSupport() {
    incrementSupportCount(gameId, defaultCount);
  }

  return (
    <div className={compact ? undefined : "mt-8 border-t border-zinc-800 pt-8"}>
      <p className={compact ? "text-sm text-zinc-400" : "text-lg text-zinc-300"}>
        <span aria-hidden="true">❤ </span>
        {count}人が応援中
      </p>
      <button
        type="button"
        onClick={handleSupport}
        className={
          compact
            ? "mt-2 w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
            : "mt-4 w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 text-lg font-semibold text-zinc-950 transition-opacity hover:opacity-90 sm:w-auto"
        }
      >
        応援する
      </button>
    </div>
  );
}
