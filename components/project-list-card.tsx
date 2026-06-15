"use client";

import Link from "next/link";
import { GameThumbnail } from "@/components/game-thumbnail";
import { useNurtureFeedbackRead } from "@/hooks/use-nurture-feedback-read";
import {
  buildNurtureDisplayContext,
  type ProjectGrowthSnapshot,
} from "@/lib/project-growth-state";
import { gamePlayHref, projectStudioPath } from "@/lib/project-nurture-links";
import type { Game } from "@/lib/mock-games";

type ProjectListCardProps = {
  game: Game;
  growth: ProjectGrowthSnapshot;
  feedbackId?: string;
  supportCount: number;
  onDelete: () => void;
};

export function ProjectListCard({
  game,
  growth,
  feedbackId,
  supportCount,
  onDelete,
}: ProjectListCardProps) {
  const { isRead: feedbackRead } = useNurtureFeedbackRead(
    game.id,
    feedbackId,
  );
  const display = buildNurtureDisplayContext(growth, feedbackRead, game.id);

  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-zinc-800/80">
          <GameThumbnail
            thumbnailUrl={game.thumbnailUrl}
            status={game.status}
            projectId={game.id}
            title={game.title}
            genre={game.genre}
            phase={game.phase}
            aspectClassName="aspect-[4/3] h-full w-full"
            showStatus={false}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="text-base font-semibold text-zinc-100">{game.title}</h2>
            {growth.pendingFeedbackCount > 0 && (
              <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-400">
                新しい回答
              </span>
            )}
            {growth.needsAttention && growth.pendingFeedbackCount === 0 && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                要対応
              </span>
            )}
          </div>

          <p className="mt-1 text-xs text-zinc-600">
            v{growth.playableVersion}
            {growth.cycleNumber > 0 && ` · サイクル ${growth.cycleNumber}`}
            {" · "}
            応援 {supportCount}
          </p>

          <p className="mt-2 text-sm text-zinc-400">
            次: <span className="text-zinc-200">{display.heroTitle}</span>
            {display.heroSubline && (
              <span className="text-zinc-500"> — {display.heroSubline}</span>
            )}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href={projectStudioPath(game.id)}
              className="inline-flex items-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
            >
              この作品を育てる
            </Link>
            <Link
              href={gamePlayHref(game.id)}
              className="text-xs font-medium text-zinc-500 transition-colors hover:text-orange-400"
            >
              プレイヤー向けページ
            </Link>
            <button
              type="button"
              onClick={onDelete}
              className="text-xs text-red-400/80 transition-colors hover:text-red-300"
            >
              削除
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
