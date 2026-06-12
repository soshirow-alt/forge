"use client";

import { useGames } from "@/components/games-provider";

type BookmarkButtonProps = {
  gameId: string;
  className?: string;
  compact?: boolean;
};

export function BookmarkButton({
  gameId,
  className = "",
  compact = false,
}: BookmarkButtonProps) {
  const { isBookmarked, bookmarkGame } = useGames();
  const saved = isBookmarked(gameId);

  function handleClick() {
    if (!saved) {
      bookmarkGame(gameId);
    }
  }

  const baseClassName = compact
    ? "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
    : "rounded-lg border px-4 py-2 text-sm font-medium transition-colors";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={saved}
      className={
        saved
          ? `${baseClassName} border-zinc-700 text-zinc-400 ${className}`
          : `${baseClassName} border-zinc-700 text-zinc-200 hover:border-orange-500/50 hover:bg-zinc-900 hover:text-orange-400 ${className}`
      }
    >
      {saved ? "保存済み" : "あとで遊ぶ"}
    </button>
  );
}
