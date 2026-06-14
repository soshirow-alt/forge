"use client";

import Link from "next/link";
import { GameGrowthCycle } from "@/components/game-growth-cycle";
import { GameThumbnail } from "@/components/game-thumbnail";
import { displayPhase } from "@/lib/development-phases";
import type { NurtureStepId, ProjectGrowthSnapshot } from "@/lib/project-growth-state";
import type { Game } from "@/lib/mock-games";
import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";

type ProjectGrowthCardProps = {
  game: Game;
  growth: ProjectGrowthSnapshot;
  feedbackEntries: ProjectFeedbackEntry[];
  supportCount: number;
  onDelete: () => void;
  focusStep?: NurtureStepId | null;
};

export function ProjectGrowthCard({
  game,
  growth,
  feedbackEntries,
  supportCount,
  onDelete,
  focusStep = null,
}: ProjectGrowthCardProps) {
  return (
    <article
      id={`project-${game.id}`}
      className={`scroll-mt-24 rounded-xl border bg-zinc-900/80 ${
        growth.needsAttention ? "border-orange-500/30" : "border-zinc-800"
      }`}
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:gap-5">
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg sm:h-20 sm:w-28">
          <GameThumbnail
            thumbnailUrl={game.thumbnailUrl}
            status={game.status}
            projectId={game.id}
            title={game.title}
            genre={game.genre}
            phase={game.phase}
            aspectClassName="aspect-[4/3] h-full w-full"
            showStatus={false}
            overlayClassName=""
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-lg font-semibold text-zinc-100">{game.title}</h2>
            <span className="text-xs text-zinc-600">{displayPhase(game.phase)}</span>
          </div>

          <p className="mt-2 text-xs text-zinc-500">
            最新版 {growth.playableVersion} · 最終更新 {growth.lastUpdatedLabel} ·
            応援 {supportCount}
            {growth.cycleNumber > 0 && ` · 改善サイクル ${growth.cycleNumber}`}
            {growth.pendingFeedbackCount > 0 && " · 新しい声あり"}
          </p>

          <div className="mt-4">
            <GameGrowthCycle
              game={game}
              growth={growth}
              feedbackEntries={feedbackEntries}
              detailPanelId={`project-${game.id}-detail`}
              initialSelectedStep={focusStep}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-4 text-sm">
            <Link
              href={`/games/${game.id}`}
              className="text-zinc-500 transition-colors hover:text-orange-400"
            >
              作品詳細
            </Link>
            <Link
              href={`/projects/${game.id}/edit`}
              className="text-zinc-500 transition-colors hover:text-orange-400"
            >
              投稿を編集
            </Link>
            <button
              type="button"
              onClick={onDelete}
              className="text-red-400 transition-colors hover:text-red-300"
            >
              削除
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
