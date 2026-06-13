"use client";

import { useGames } from "@/components/games-provider";

type GameWatchButtonProps = {
  gameId: string;
  className?: string;
  compact?: boolean;
};

export function GameWatchButton({
  gameId,
  className = "",
  compact = false,
}: GameWatchButtonProps) {
  const { isWatching, watchGame, unwatchGame } = useGames();
  const watching = isWatching(gameId);

  function handleClick() {
    if (watching) {
      unwatchGame(gameId);
      return;
    }
    watchGame(gameId);
  }

  const baseClassName = compact
    ? "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
    : "rounded-lg border px-4 py-2 text-sm font-medium transition-colors";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        watching
          ? `${baseClassName} border-orange-500/40 bg-orange-500/10 text-orange-300 ${className}`
          : `${baseClassName} border-zinc-700 text-zinc-200 hover:border-orange-500/50 hover:bg-zinc-900 hover:text-orange-400 ${className}`
      }
    >
      {watching ? "更新を追跡中" : "更新を追う"}
    </button>
  );
}
