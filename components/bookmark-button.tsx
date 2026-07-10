"use client";

import { AuthGatedHint } from "@/components/auth-gated-hint";
import { useGames } from "@/components/games-provider";
import { useRequireAuth } from "@/hooks/use-require-auth";

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
  const { isLoggedIn, requireAuth } = useRequireAuth();
  const saved = isBookmarked(gameId);

  function handleClick() {
    requireAuth(
      () => {
        void bookmarkGame(gameId);
      },
      undefined,
      { variant: "bookmark" },
    );
  }

  const baseClassName = compact
    ? "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
    : "rounded-lg border px-4 py-2 text-sm font-medium transition-colors";

  const label = !isLoggedIn
    ? "ログインしてあとで見る"
    : saved
      ? "保存済み"
      : "あとで見る";

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoggedIn && saved}
        title={isLoggedIn ? undefined : "ログインすると使えます"}
        className={
          saved
            ? `${baseClassName} w-full border-zinc-700 text-zinc-400`
            : `${baseClassName} w-full border-zinc-700 text-zinc-200 hover:border-orange-500/50 hover:bg-zinc-900 hover:text-orange-400`
        }
      >
        {label}
      </button>
      {!isLoggedIn && compact && (
        <AuthGatedHint hint="ログインすると使えます" className="mt-1 text-center" />
      )}
    </div>
  );
}
