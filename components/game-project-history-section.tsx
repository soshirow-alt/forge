"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import {
  formatActivityDate,
  getUnifiedProjectHistory,
} from "@/lib/project-activity";
import { GAME_PROJECT_HISTORY_SECTION_ID, projectStudioDevlogHref } from "@/lib/project-nurture-links";
import type { Game } from "@/lib/mock-games";
import type { ProjectHistoryEntry } from "@/lib/project-activity";

type GameProjectHistorySectionProps = {
  game: Game;
};

function buildVersionLabels(entries: ProjectHistoryEntry[]): Map<string, string> {
  const developmentEntries = entries
    .filter((entry) => entry.kind === "development")
    .sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

  const labels = new Map<string, string>();
  developmentEntries.forEach((entry, index) => {
    labels.set(
      entry.id,
      entry.publishedVersion ?? `v0.${index + 1}`,
    );
  });
  return labels;
}

export function GameProjectHistorySection({ game }: GameProjectHistorySectionProps) {
  const { user } = useAuth();
  const { getDevlogsByProject, isProjectOwner } = useGames();
  const realDevlogs = getDevlogsByProject(game.id);
  const { entries, usingPlaceholderDevlogs } = getUnifiedProjectHistory(
    game,
    realDevlogs,
  );
  const canPost = isProjectOwner(game.id, user?.id);
  const versionLabels = buildVersionLabels(entries);
  const latestDevIndex = entries.findIndex(
    (entry) => entry.kind === "development",
  );

  return (
    <section
      id={GAME_PROJECT_HISTORY_SECTION_ID}
      className="mt-4 scroll-mt-24 border-t border-zinc-800/80 pt-4"
    >
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-medium text-zinc-500">これまでの更新</h2>
          <p className="text-xs text-zinc-600">
            前回プレイしたあとに変わった点は、ここで確認できます
          </p>
          {usingPlaceholderDevlogs && (
            <p className="text-xs text-zinc-600">（サンプル表示）</p>
          )}
        </div>
        {canPost && (
          <Link
            href={projectStudioDevlogHref(game.id)}
            className="shrink-0 cursor-pointer rounded-md border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-200 transition-colors hover:border-orange-500/50 hover:bg-zinc-900 hover:text-orange-400"
          >
            新verの開発ログ
          </Link>
        )}
      </div>

      <ol className="relative mt-3 space-y-0 border-l border-zinc-800/80 pl-4">
        {entries.map((entry, index) => {
          const isCommunity = entry.kind === "community";
          const isLatestDev = !isCommunity && index === latestDevIndex;
          const version = versionLabels.get(entry.id);

          return (
            <li
              key={entry.id}
              className={`relative ${isCommunity ? "pb-3" : "pb-4"} last:pb-0`}
            >
              <span
                className={`absolute top-1 rounded-full border-2 ${
                  isCommunity
                    ? "-left-[1.15rem] h-2 w-2 border-zinc-700 bg-zinc-900"
                    : isLatestDev
                      ? "-left-[1.25rem] h-2.5 w-2.5 border-orange-400 bg-orange-500/30"
                      : "-left-[1.25rem] h-2.5 w-2.5 border-zinc-600 bg-zinc-900"
                }`}
                aria-hidden
              />
              <time
                dateTime={entry.date}
                className={`tabular-nums ${
                  isCommunity
                    ? "text-[11px] text-zinc-600"
                    : "text-xs font-medium text-zinc-500"
                }`}
              >
                {formatActivityDate(entry.date)}
              </time>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                {!isCommunity && version && (
                  <span className="text-[11px] font-semibold text-orange-400/90">
                    {version}
                  </span>
                )}
                {isCommunity && (
                  <span className="text-[11px] text-zinc-600">改善を反映</span>
                )}
                <h3
                  className={
                    isCommunity
                      ? "text-xs text-zinc-500"
                      : "text-sm font-semibold text-zinc-100"
                  }
                >
                  {entry.title}
                </h3>
              </div>
              {!usingPlaceholderDevlogs &&
                entry.kind === "development" &&
                entry.content && (
                  <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                    {entry.content}
                  </p>
                )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
