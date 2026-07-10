"use client";

import { AuthGatedHint } from "@/components/auth-gated-hint";
import { useGames } from "@/components/games-provider";
import { getDefaultSupportCount } from "@/lib/demo-activity";
import { useRequireAuth } from "@/hooks/use-require-auth";

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
  const { getSupportCount, isSupported, supportGame } = useGames();
  const { isLoggedIn, requireAuth } = useRequireAuth();
  const defaultCount = getDefaultSupportCount(gameId, isUserSubmitted);
  const count = getSupportCount(gameId, defaultCount);
  const supported = isSupported(gameId);

  function handleSupport() {
    requireAuth(
      () => {
        void supportGame(gameId);
      },
      undefined,
      { variant: "default" },
    );
  }

  const label = !isLoggedIn
    ? "ログインして応援"
    : supported
      ? "応援中"
      : "応援する";

  return (
    <div className={compact ? undefined : "mt-8 border-t border-zinc-800 pt-8"}>
      <p className={compact ? "text-sm text-zinc-400" : "text-lg text-zinc-300"}>
        <span aria-hidden="true">❤ </span>
        {count}人が応援中
      </p>
      {!isLoggedIn && (
        <AuthGatedHint
          hint="応援・更新通知・あとで見るを保存できます"
          className="mt-1"
        />
      )}
      <button
        type="button"
        onClick={handleSupport}
        disabled={isLoggedIn && supported}
        title={isLoggedIn ? undefined : "ログインすると使えます"}
        className={
          compact
            ? `mt-2 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity ${
                supported
                  ? "border border-orange-500/40 bg-orange-500/10 text-orange-300"
                  : "bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 hover:opacity-90"
              }`
            : `mt-4 w-full rounded-lg px-8 py-4 text-lg font-semibold transition-opacity sm:w-auto ${
                supported
                  ? "border border-orange-500/40 bg-orange-500/10 text-orange-300"
                  : "bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 hover:opacity-90"
              }`
        }
      >
        {label}
      </button>
    </div>
  );
}
