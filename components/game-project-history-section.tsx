"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import {
  formatActivityDate,
  getUnifiedProjectHistory,
} from "@/lib/project-activity";
import type { Game } from "@/lib/mock-games";

type GameProjectHistorySectionProps = {
  game: Game;
};

function getDevelopmentEntryLabel(title: string): string {
  if (title === "初公開") {
    return "初公開";
  }

  if (/テスト|α版|β版/.test(title)) {
    return "テスト開始";
  }

  return "アップデート";
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
  const latestDevIndex = entries.findIndex(
    (entry) => entry.kind === "development",
  );

  return (
    <section className="mt-4 border-t border-zinc-800/80 pt-4">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-medium text-zinc-500">開発の歩み</h2>
          {usingPlaceholderDevlogs && (
            <p className="text-xs text-zinc-600">更新履歴（サンプル表示）</p>
          )}
        </div>
        {canPost && (
          <Link
            href={`/projects/${game.id}/devlog/new`}
            className="shrink-0 rounded-md border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-200 transition-colors hover:border-orange-500/50 hover:bg-zinc-900 hover:text-orange-400"
          >
            開発ログを投稿
          </Link>
        )}
      </div>

      <ol className="relative mt-3 space-y-0 border-l border-zinc-800/80 pl-4">
        {entries.map((entry, index) => {
          const isCommunity = entry.kind === "community";
          const isLatestDev = !isCommunity && index === latestDevIndex;

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
                {!isCommunity && (
                  <span className="text-[11px] font-medium text-orange-400/80">
                    {getDevelopmentEntryLabel(entry.title)}
                  </span>
                )}
                {isCommunity && (
                  <span className="text-[11px] text-zinc-600">
                    プレイヤー提案を反映
                  </span>
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
