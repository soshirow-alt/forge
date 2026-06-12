"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import {
  formatActivityDate,
  getDevelopmentLogEntries,
} from "@/lib/project-activity";
import type { Game } from "@/lib/mock-games";

type GameDevlogSectionProps = {
  game: Game;
};

export function GameDevlogSection({ game }: GameDevlogSectionProps) {
  const { user } = useAuth();
  const { getDevlogsByProject, isProjectOwner } = useGames();
  const realDevlogs = getDevlogsByProject(game.id);
  const entries = getDevelopmentLogEntries(game, realDevlogs);
  const usingPlaceholder = realDevlogs.length === 0;
  const canPost = isProjectOwner(game.id, user?.id);

  return (
    <div className="mt-8 border-t border-zinc-800 pt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-medium text-zinc-500">開発ログ</h2>
          {usingPlaceholder && (
            <p className="mt-1 text-xs text-zinc-600">
              この作品の開発の歩み（サンプル表示）
            </p>
          )}
        </div>
        {canPost && (
          <Link
            href={`/projects/${game.id}/devlog/new`}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-orange-500/50 hover:bg-zinc-900 hover:text-orange-400"
          >
            開発ログを投稿する
          </Link>
        )}
      </div>

      <ol className="relative mt-6 space-y-0 border-l border-zinc-800 pl-6">
        {entries.map((entry, index) => (
          <li key={entry.id} className="relative pb-8 last:pb-0">
            <span
              className={`absolute -left-[1.65rem] top-1.5 h-3 w-3 rounded-full border-2 ${
                index === 0
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
            <h3 className="mt-1 text-base font-semibold text-zinc-100">
              {entry.title}
            </h3>
            {!usingPlaceholder && entry.content && (
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {entry.content}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
