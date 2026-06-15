"use client";

import Link from "next/link";
import { GameGrowthCycle } from "@/components/game-growth-cycle";
import { GameThumbnail } from "@/components/game-thumbnail";
import { ProjectNurtureActions } from "@/components/project-nurture-actions";
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
      className="scroll-mt-24 rounded-xl bg-zinc-900/60"
    >
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:gap-6">
        <div className="order-2 h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-lg opacity-80 sm:order-1 sm:h-16 sm:w-20">
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

        <div className="order-1 min-w-0 flex-1 sm:order-2">
          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-base font-semibold text-zinc-300">{game.title}</h2>
            {growth.pendingFeedbackCount > 0 && (
              <span className="text-[10px] font-medium text-orange-400/90">
                新しい声
              </span>
            )}
            <span className="text-[10px] text-zinc-600">
              v{growth.playableVersion}
              {growth.cycleNumber > 0 && ` · サイクル ${growth.cycleNumber}`}
            </span>
          </div>

          <GameGrowthCycle
            game={game}
            growth={growth}
            feedbackEntries={feedbackEntries}
            detailPanelId={`project-${game.id}-detail`}
            initialSelectedStep={focusStep}
          />

          <ProjectNurtureActions projectId={game.id} className="mt-5" />

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-zinc-600">
            <span className="text-zinc-700">応援 {supportCount}</span>
            <button
              type="button"
              onClick={onDelete}
              className="text-red-400/80 transition-colors hover:text-red-300"
            >
              削除
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
