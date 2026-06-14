"use client";

import Link from "next/link";
import { FeedbackStructuredCard } from "@/components/feedback-structured-card";
import { useGames } from "@/components/games-provider";
import { formatFeedbackDate } from "@/lib/feedback-display";
import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";

const primaryButtonClassName =
  "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90";

const secondaryButtonClassName =
  "inline-flex items-center justify-center rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-orange-500/50 hover:text-orange-400";

type DeveloperFeedbackInboxProps = {
  userId: string;
  entries: ProjectFeedbackEntry[];
  loaded: boolean;
};

export function DeveloperFeedbackInbox({
  userId,
  entries,
  loaded,
}: DeveloperFeedbackInboxProps) {
  const { getOwnedProjects } = useGames();

  const ownedGames = getOwnedProjects(userId);
  const titleByProjectId = new Map(
    ownedGames.map((game) => [game.id, game.title]),
  );

  if (!loaded) {
    return (
      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">フィードバック</h2>
        <p className="mt-2 text-sm text-zinc-500">読み込み中...</p>
      </section>
    );
  }

  return (
    <section id="developer-feedback" className="mt-10 scroll-mt-24">
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
              id={`feedback-${projectId}`}
              className="scroll-mt-24 rounded-xl border border-zinc-800 bg-zinc-900/80 p-5"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <Link
                    href={`/games/${projectId}`}
                    className="font-semibold text-zinc-100 transition-colors hover:text-orange-400"
                  >
                    {titleByProjectId.get(projectId) ?? projectId}
                  </Link>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    プレイ可能版 {item.versionKey ?? "0.1"} · 投稿日時:{" "}
                    {formatFeedbackDate(item.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-zinc-800/80 pt-4">
                <FeedbackStructuredCard item={item} showDate={false} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-800/80 pt-4">
                <Link
                  href={`/projects/${projectId}/devlog/new`}
                  className={primaryButtonClassName}
                >
                  このFBをもとに開発ログを書く
                </Link>
                <Link
                  href={`/games/${projectId}`}
                  className={secondaryButtonClassName}
                >
                  作品詳細を見る
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
