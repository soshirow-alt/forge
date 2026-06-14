"use client";

import { useGames } from "@/components/games-provider";
import {
  getDefaultApplicantCount,
  getDefaultSupportCount,
  getGameActivitySnapshot,
} from "@/lib/demo-activity";
import type { Game } from "@/lib/mock-games";

type GameActivityBadgesProps = {
  game: Pick<Game, "id" | "lastUpdated" | "lookingForTesters" | "testerSlots">;
  compact?: boolean;
};

function ActivityBadge({
  children,
  tone = "neutral",
  compact = false,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "support" | "test" | "update";
  compact?: boolean;
}) {
  const styles = {
    neutral: "border-zinc-700/60 bg-zinc-950/60 text-zinc-400",
    support: "border-orange-500/25 bg-orange-500/5 text-orange-300/90",
    test: "border-violet-500/25 bg-violet-500/5 text-violet-300/90",
    update: "border-emerald-500/25 bg-emerald-500/5 text-emerald-300/90",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium tabular-nums ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-[11px]"
      } ${styles}`}
    >
      {children}
    </span>
  );
}

export function GameActivityBadges({
  game,
  compact = false,
}: GameActivityBadgesProps) {
  const { getSupportCount, getApplicantCount, isSubmittedGame } = useGames();
  const isSubmitted = isSubmittedGame(game.id);
  const snapshot = getGameActivitySnapshot(game, {
    isSubmitted,
    supportCount: getSupportCount(
      game.id,
      getDefaultSupportCount(game.id, isSubmitted),
    ),
    applicantCount: getApplicantCount(
      game.id,
      getDefaultApplicantCount(game.id, isSubmitted),
    ),
  });

  if (!snapshot) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {(snapshot.supportCount > 0 || snapshot.hasBuiltInDemoData) && (
        <ActivityBadge tone="support" compact={compact}>
          応援 {snapshot.supportCount}
        </ActivityBadge>
      )}
      {snapshot.recentActivityLabel && (
        <ActivityBadge tone="update" compact={compact}>
          {snapshot.recentActivityLabel}
        </ActivityBadge>
      )}
    </div>
  );
}
