"use client";

import { AuthGatedHint } from "@/components/auth-gated-hint";
import { useGames } from "@/components/games-provider";
import { useRequireAuth } from "@/hooks/use-require-auth";

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
  const { isLoggedIn, requireAuth } = useRequireAuth();
  const watching = isWatching(gameId);

  function handleClick() {
    requireAuth(() => {
      if (watching) {
        void unwatchGame(gameId);
        return;
      }
      void watchGame(gameId);
    });
  }

  const baseClassName = compact
    ? "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
    : "rounded-lg border px-4 py-2 text-sm font-medium transition-colors";

  const label = !isLoggedIn
    ? "ログインして更新を追う"
    : watching
      ? "更新を追跡中"
      : "更新を追う";

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        title={isLoggedIn ? undefined : "ログインすると使えます"}
        className={
          watching
            ? `${baseClassName} w-full border-orange-500/40 bg-orange-500/10 text-orange-300`
            : `${baseClassName} w-full border-zinc-700 text-zinc-200 hover:border-orange-500/50 hover:bg-zinc-900 hover:text-orange-400`
        }
      >
        {label}
      </button>
      {!isLoggedIn && compact && (
        <AuthGatedHint
          hint="応援・更新通知・あとで見るを保存できます"
          className="mt-1 text-center"
        />
      )}
    </div>
  );
}
