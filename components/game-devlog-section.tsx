"use client";

import Link from "next/link";
import { useGames } from "@/components/games-provider";

function formatDevlogDate(date: string) {
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function GameDevlogSection({ projectId }: { projectId: string }) {
  const { getDevlogsByProject } = useGames();
  const devlogs = getDevlogsByProject(projectId);

  return (
    <div className="mt-8 border-t border-zinc-800 pt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-medium text-zinc-500">開発日誌</h2>
        <Link
          href={`/projects/${projectId}/devlog/new`}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-orange-500/50 hover:bg-zinc-900 hover:text-orange-400"
        >
          開発日誌を投稿する
        </Link>
      </div>

      {devlogs.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-600">
          まだ開発日誌はありません。
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {devlogs.map((entry) => (
            <li
              key={entry.id}
              className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
            >
              <h3 className="font-semibold text-zinc-100">{entry.title}</h3>
              <p className="mt-1 text-sm text-zinc-500">
                {formatDevlogDate(entry.date)}
              </p>
              <p className="mt-3 leading-relaxed text-zinc-300">
                {entry.content}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
