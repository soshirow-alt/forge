"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FeedbackStructuredCard } from "@/components/feedback-structured-card";
import { useGames } from "@/components/games-provider";
import { formatFeedbackDate } from "@/lib/feedback-display";
import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";

type DeveloperFeedbackInboxProps = {
  userId: string;
};

export function DeveloperFeedbackInbox({ userId }: DeveloperFeedbackInboxProps) {
  const { getOwnedProjects, getOwnedProjectFeedback } = useGames();
  const [entries, setEntries] = useState<ProjectFeedbackEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const ownedGames = useMemo(
    () => getOwnedProjects(userId),
    [getOwnedProjects, userId],
  );

  const titleByProjectId = useMemo(() => {
    const map = new Map<string, string>();
    for (const game of ownedGames) {
      map.set(game.id, game.title);
    }
    return map;
  }, [ownedGames]);

  useEffect(() => {
    void getOwnedProjectFeedback(userId)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoaded(true));
  }, [getOwnedProjectFeedback, userId]);

  if (!loaded) {
    return (
      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">フィードバック</h2>
        <p className="mt-2 text-sm text-zinc-500">読み込み中...</p>
      </section>
    );
  }

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold tracking-tight">フィードバック</h2>
      <p className="mt-1 text-sm text-zinc-500">
        プレイヤーから届いた改善材料です。レビューではなく、次の更新の参考にしてください。
      </p>

      {entries.length === 0 ? (
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-12 text-center">
          <p className="text-zinc-400">まだフィードバックは届いていません。</p>
          <p className="mt-2 text-sm text-zinc-600">
            作品を公開し、プレイヤーに遊んでもらうとここに表示されます。
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {entries.map(({ projectId, item }) => (
            <article
              key={item.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link
                    href={`/games/${projectId}`}
                    className="font-semibold text-zinc-100 transition-colors hover:text-orange-400"
                  >
                    {titleByProjectId.get(projectId) ?? projectId}
                  </Link>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    投稿日時: {formatFeedbackDate(item.createdAt)}
                  </p>
                </div>
                <Link
                  href={`/games/${projectId}`}
                  className="mt-2 shrink-0 text-xs font-medium text-zinc-500 transition-colors hover:text-orange-400 sm:mt-0"
                >
                  作品詳細を見る →
                </Link>
              </div>

              <div className="mt-4 border-t border-zinc-800/80 pt-4">
                <FeedbackStructuredCard item={item} showDate={false} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
