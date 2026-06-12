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
  secondary?: boolean;
};

export function GameProjectHistorySection({
  game,
  secondary = false,
}: GameProjectHistorySectionProps) {
  const { user } = useAuth();
  const { getDevlogsByProject, isProjectOwner } = useGames();
  const realDevlogs = getDevlogsByProject(game.id);
  const { entries, usingPlaceholderDevlogs } = getUnifiedProjectHistory(
    game,
    realDevlogs,
  );
  const canPost = isProjectOwner(game.id, user?.id);

  return (
    <section
      className={
        secondary ? "mt-5 border-t border-zinc-800/80 pt-5 lg:mt-6" : undefined
      }
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            className={
              secondary
                ? "text-xs font-medium uppercase tracking-wide text-zinc-600"
                : "text-sm font-medium text-zinc-500"
            }
          >
            開発の歩み
          </h2>
          {usingPlaceholderDevlogs && (
            <p className="mt-0.5 text-xs text-zinc-600">
              更新とプレイヤー反映の履歴（サンプル表示）
            </p>
          )}
        </div>
        {canPost && (
          <Link
            href={`/projects/${game.id}/devlog/new`}
            className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-orange-500/50 hover:bg-zinc-900 hover:text-orange-400"
          >
            開発ログを投稿
          </Link>
        )}
      </div>

      <ol
        className={`relative space-y-0 border-l border-zinc-800/80 pl-5 ${
          secondary ? "mt-3" : "mt-4"
        }`}
      >
        {entries.map((entry, index) => {
          const isCommunity = entry.kind === "community";
          const isLatest = index === 0;

          return (
            <li key={entry.id} className="relative pb-5 last:pb-0">
              <span
                className={`absolute -left-[1.4rem] top-1 h-2.5 w-2.5 rounded-full border-2 ${
                  isCommunity
                    ? "border-emerald-500/60 bg-emerald-500/20"
                    : isLatest
                      ? "border-orange-400 bg-orange-500/30"
                      : "border-zinc-600 bg-zinc-900"
                }`}
                aria-hidden
              />
              <time
                dateTime={entry.date}
                className="text-xs font-medium tabular-nums text-zinc-500"
              >
                {formatActivityDate(entry.date)}
              </time>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                {isCommunity && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                    <span aria-hidden>✔</span>
                    <span>プレイヤー反映</span>
                  </span>
                )}
                <h3
                  className={`text-sm font-semibold ${
                    isCommunity ? "text-zinc-200" : "text-zinc-100"
                  }`}
                >
                  {entry.title}
                </h3>
              </div>
              {!usingPlaceholderDevlogs &&
                entry.kind === "development" &&
                entry.content && (
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
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
