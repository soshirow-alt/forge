"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import {
  useFeedbackHistoryGames,
  useMyPageFeedbackHistory,
} from "@/hooks/use-mypage-feedback-history";
import type { FeedbackHistoryEntry } from "@/lib/mypage-feedback-history";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

function FeedbackHistoryCard({
  entry,
  title,
  available,
}: {
  entry: FeedbackHistoryEntry;
  title: string;
  available: boolean;
}) {
  const version =
    entry.versionKey?.trim().replace(/^v/i, "") || null;

  return (
    <article className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2.5">
      <div className="flex gap-3">
        <div className="shrink-0 overflow-hidden rounded-md">
          {available ? (
            <ProjectThumbnail
              projectId={entry.projectId}
              title={title}
              version={version ?? undefined}
              variant="mini"
            />
          ) : (
            <div className="flex aspect-video w-[140px] items-center justify-center rounded-lg bg-zinc-900 text-[10px] text-zinc-600">
              利用不可
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h3 className="truncate text-sm font-semibold text-zinc-100">
              {available ? (
                <Link
                  href={`/games/${entry.projectId}`}
                  className="transition-colors hover:text-violet-200"
                >
                  {title}
                </Link>
              ) : (
                <span className="text-zinc-400">{title}</span>
              )}
            </h3>
            <span className="text-[11px] text-zinc-500">
              {formatDate(entry.createdAt)}
            </span>
            {version ? (
              <span className="text-[11px] text-zinc-500">ver {version}</span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2 py-0.5 text-[10px] text-zinc-400">
              {entry.kindLabel}
            </span>
            {entry.reflected ? (
              <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-200">
                更新に反映
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-zinc-400">
            {entry.summary}
          </p>
          {available ? (
            <Link
              href={`/games/${entry.projectId}`}
              className="mt-2 inline-block text-xs text-violet-400 transition-colors hover:text-violet-300"
            >
              作品を見る →
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function MyPageFeedbackHistoryPanel() {
  const { user } = useAuth();
  const { entries, loading } = useMyPageFeedbackHistory();
  const games = useFeedbackHistoryGames(entries);

  if (!user) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-16 text-center">
        <h2 className="text-lg font-semibold text-zinc-200">
          FB履歴を見るにはログインが必要です
        </h2>
        <Link
          href="/login?return=/mypage?tab=feedback"
          className="mt-6 inline-block rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
        >
          ログイン
        </Link>
      </div>
    );
  }

  if (loading) {
    return <p className="text-sm text-zinc-600">読み込み中...</p>;
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-16 text-center">
        <h2 className="text-lg font-semibold text-zinc-200">
          送信したフィードバックはまだありません
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-zinc-500">
          作品をプレイしてフィードバックを送ると、ここに履歴が表示されます。
        </p>
        <Link
          href="/home"
          className="mt-6 inline-block rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
        >
          作品を探す
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry) => {
        const meta = games.get(entry.projectId);
        return (
          <li key={entry.id}>
            <FeedbackHistoryCard
              entry={entry}
              title={meta?.title ?? "非公開または削除された作品"}
              available={meta?.available ?? false}
            />
          </li>
        );
      })}
    </ul>
  );
}
