"use client";

import { useGames } from "@/components/games-provider";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { getDefaultApplicantCount } from "@/lib/demo-activity";
import { LABEL_TEST_PLAY_JOIN, LABEL_TEST_PLAY_OPEN } from "@/lib/user-labels";

type GameTesterApplyProps = {
  gameId: string;
  testerSlots: number;
  isUserSubmitted: boolean;
  compact?: boolean;
};

export function GameTesterApply({
  gameId,
  testerSlots,
  isUserSubmitted,
  compact = false,
}: GameTesterApplyProps) {
  const { getApplicantCount, incrementApplicantCount } = useGames();
  const { isLoggedIn, requireAuth } = useRequireAuth();
  const defaultCount = getDefaultApplicantCount(gameId, isUserSubmitted);
  const applicantCount = getApplicantCount(gameId, defaultCount);

  function handleApply() {
    requireAuth(() => {
      incrementApplicantCount(gameId, defaultCount);
    });
  }

  return (
    <div
      className={
        compact
          ? "border-t border-zinc-800 pt-4"
          : "mt-8 border-t border-zinc-800 pt-8"
      }
    >
      <p
        className={
          compact
            ? "text-xs font-medium text-orange-400"
            : "text-sm font-medium text-orange-400"
        }
      >
        {LABEL_TEST_PLAY_OPEN}
      </p>
      <p className="mt-1 text-sm text-zinc-300">募集 {testerSlots}人</p>
      <p className="mt-0.5 text-xs text-zinc-500">
        応募 {applicantCount} / {testerSlots}人
      </p>
      <button
        type="button"
        onClick={handleApply}
        title={isLoggedIn ? undefined : "ログインすると使えます"}
        className={
          compact
            ? "mt-2 w-full rounded-lg border border-orange-500/50 bg-orange-500/10 px-4 py-2.5 text-sm font-semibold text-orange-400 transition-colors hover:bg-orange-500/20"
            : "mt-4 w-full rounded-lg border border-orange-500/50 bg-orange-500/10 px-8 py-4 text-lg font-semibold text-orange-400 transition-colors hover:bg-orange-500/20 sm:w-auto"
        }
      >
        {isLoggedIn ? LABEL_TEST_PLAY_JOIN : "ログインして応募"}
      </button>
    </div>
  );
}
