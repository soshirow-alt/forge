"use client";

import Link from "next/link";
import { GameThumbnail } from "@/components/game-thumbnail";
import { useNurtureVoiceRead } from "@/hooks/use-nurture-feedback-read";
import {
  buildNurtureDisplayContext,
  getProjectStatusBadges,
  type ProjectGrowthSnapshot,
} from "@/lib/project-growth-state";
import { gamePlayHref, projectStudioPath } from "@/lib/project-nurture-links";
import type { Game } from "@/lib/mock-games";

const BADGE_TONE_CLASS: Record<
  ReturnType<typeof getProjectStatusBadges>[number]["tone"],
  string
> = {
  orange: "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/30",
  amber: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30",
  sky: "bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/30",
};

type ProjectListCardProps = {
  game: Game;
  growth: ProjectGrowthSnapshot;
  supportCount: number;
  onDelete: () => void;
  compact?: boolean;
  /** home = 改善ループ入口はホームの CTA。directory = 一覧用（ワッペンのみ） */
  layout?: "hub" | "directory";
};

export function ProjectListCard({
  game,
  growth,
  supportCount,
  onDelete,
  compact = false,
  layout = "hub",
}: ProjectListCardProps) {
  const { isRead: voiceRead } = useNurtureVoiceRead(
    game.id,
    growth.playableVersion,
  );
  const display = buildNurtureDisplayContext(growth, voiceRead, game.id);
  const statusBadges = getProjectStatusBadges(growth, voiceRead);
  const hasHighlight = statusBadges.length > 0;

  if (layout === "directory") {
    return (
      <Link
        href={projectStudioPath(game.id)}
        className={`block rounded-xl border bg-zinc-900/60 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80 ${
          hasHighlight ? "border-orange-500/40 ring-1 ring-orange-500/15" : "border-zinc-800"
        } ${compact ? "p-4" : "p-5"}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div
            className={`shrink-0 overflow-hidden rounded-lg border border-zinc-800/80 ${
              compact ? "h-14 w-20" : "h-16 w-24"
            }`}
          >
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
              {statusBadges.map((badge) => (
                <span
                  key={badge.label}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${BADGE_TONE_CLASS[badge.tone]}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>

            <p className="mt-1 text-xs text-zinc-600">
              v{growth.playableVersion}
              {growth.cycleNumber > 0 && ` · サイクル ${growth.cycleNumber}`}
              {growth.totalVoiceResponseCount > 0 &&
                ` · 回答 ${growth.totalVoiceResponseCount}件`}
              {" · "}
              応援 {supportCount}
              {" · "}
              最終更新 {game.lastUpdated}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <article
      className={`rounded-xl border border-zinc-800 bg-zinc-900/60 ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div
          className={`shrink-0 overflow-hidden rounded-lg border border-zinc-800/80 ${
            compact ? "h-14 w-20" : "h-16 w-24"
          }`}
        >
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
            {statusBadges.map((badge) => (
              <span
                key={badge.label}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${BADGE_TONE_CLASS[badge.tone]}`}
              >
                {badge.label}
              </span>
            ))}
          </div>

          <p className="mt-1 text-xs text-zinc-600">
            v{growth.playableVersion}
            {growth.cycleNumber > 0 && ` · サイクル ${growth.cycleNumber}`}
            {growth.totalVoiceResponseCount > 0 &&
              ` · 回答 ${growth.totalVoiceResponseCount}件`}
            {" · "}
            応援 {supportCount}
          </p>

          <p className={`text-zinc-400 ${compact ? "mt-1 text-xs" : "mt-2 text-sm"}`}>
            いま: <span className="text-zinc-200">{display.phaseLabel}</span>
          </p>

          <div className={`flex flex-wrap items-center gap-3 ${compact ? "mt-3" : "mt-4"}`}>
            <Link
              href={projectStudioPath(game.id)}
              className={`inline-flex cursor-pointer items-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 font-semibold text-zinc-950 transition-opacity hover:opacity-90 ${
                compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
              }`}
            >
              作品 Studio を開く
            </Link>
            {!compact && (
              <Link
                href={gamePlayHref(game.id)}
                className="cursor-pointer text-xs font-medium text-zinc-500 transition-colors hover:text-orange-400"
              >
                プレイヤー向けページ
              </Link>
            )}
            {!compact && (
              <button
                type="button"
                onClick={onDelete}
                className="cursor-pointer text-xs text-red-400/80 transition-colors hover:text-red-300"
              >
                削除
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
