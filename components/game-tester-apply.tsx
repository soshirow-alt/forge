"use client";

import { useGames } from "@/components/games-provider";
import { LABEL_TEST_PLAY_JOIN, LABEL_TEST_PLAY_OPEN } from "@/lib/user-labels";

type GameTesterApplyProps = {
  gameId: string;
  testerSlots: number;
  isUserSubmitted: boolean;
};

export function GameTesterApply({
  gameId,
  testerSlots,
  isUserSubmitted,
}: GameTesterApplyProps) {
  const { getApplicantCount, incrementApplicantCount } = useGames();
  const defaultCount = isUserSubmitted ? 0 : 3;
  const applicantCount = getApplicantCount(gameId, defaultCount);

  function handleApply() {
    incrementApplicantCount(gameId, defaultCount);
  }

  return (
    <div className="mt-8 border-t border-zinc-800 pt-8">
      <p className="text-sm font-medium text-orange-400">{LABEL_TEST_PLAY_OPEN}</p>
      <p className="mt-2 text-zinc-300">募集人数: {testerSlots}人</p>
      <p className="mt-2 text-zinc-400">
        応募者数: {applicantCount} / {testerSlots}人
      </p>
      <button
        type="button"
        onClick={handleApply}
        className="mt-4 w-full rounded-lg border border-orange-500/50 bg-orange-500/10 px-8 py-4 text-lg font-semibold text-orange-400 transition-colors hover:bg-orange-500/20 sm:w-auto"
      >
        {LABEL_TEST_PLAY_JOIN}
      </button>
    </div>
  );
}
