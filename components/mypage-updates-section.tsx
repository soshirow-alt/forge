"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useGames } from "@/components/games-provider";
import { sortDevlogsNewestFirst, type DevlogEntry } from "@/lib/devlogs";
import {
  formatNotificationDate,
  getNotificationTypeLabel,
  type Notification,
} from "@/lib/notifications";
import {
  gameHistoryHref,
  gamePlayHref,
  gameVersionBannerHref,
} from "@/lib/project-nurture-links";
import type { Game } from "@/lib/mock-games";

type WatchedUpdateItem = {
  id: string;
  game: Game;
  kind: "devlog" | "version_published";
  label: string;
  message: string;
  date: string;
  historyHref: string;
  replayHref: string;
};

function buildWatchedUpdates(
  watchedGames: Game[],
  notifications: Notification[],
  getDevlogsByProject: (projectId: string) => DevlogEntry[],
): WatchedUpdateItem[] {
  const watchedIds = new Set(watchedGames.map((game) => game.id));
  const items = new Map<string, WatchedUpdateItem>();

  for (const notification of notifications) {
    if (!watchedIds.has(notification.projectId)) {
      continue;
    }

    if (
      notification.type !== "devlog" &&
      notification.type !== "version_published"
    ) {
      continue;
    }

    const game = watchedGames.find((entry) => entry.id === notification.projectId);
    if (!game) {
      continue;
    }

    items.set(notification.id, {
      id: notification.id,
      game,
      kind:
        notification.type === "version_published"
          ? "version_published"
          : "devlog",
      label: getNotificationTypeLabel(notification.type),
      message: notification.message,
      date: notification.date,
      historyHref:
        notification.type === "version_published"
          ? gameVersionBannerHref(notification.projectId)
          : gameHistoryHref(notification.projectId),
      replayHref:
        notification.type === "version_published"
          ? gameVersionBannerHref(notification.projectId)
          : gamePlayHref(notification.projectId),
    });
  }

  for (const game of watchedGames) {
    const latestDevlog = sortDevlogsNewestFirst(
      getDevlogsByProject(game.id),
    )[0];

    if (!latestDevlog) {
      continue;
    }

    const fallbackId = `devlog-${game.id}-${latestDevlog.id}`;
    if (items.has(fallbackId)) {
      continue;
    }

    const duplicateFromNotification = [...items.values()].some(
      (item) =>
        item.game.id === game.id &&
        item.kind === "devlog" &&
        item.message.includes(latestDevlog.title),
    );

    if (duplicateFromNotification) {
      continue;
    }

    items.set(fallbackId, {
      id: fallbackId,
      game,
      kind: "devlog",
      label: "開発日誌",
      message: `「${game.title}」— ${latestDevlog.title}`,
      date: latestDevlog.date,
      historyHref: gameHistoryHref(game.id),
      replayHref: gamePlayHref(game.id),
    });
  }

  return [...items.values()].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function MyPageUpdatesSection({ watchedGames }: { watchedGames: Game[] }) {
  const { getNotifications, getDevlogsByProject } = useGames();

  const updates = useMemo(
    () =>
      buildWatchedUpdates(
        watchedGames,
        getNotifications(),
        getDevlogsByProject,
      ),
    [watchedGames, getNotifications, getDevlogsByProject],
  );

  return (
    <section id="updates" className="scroll-mt-24">
      <div className="border-l-2 border-emerald-500 pl-4">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-100">
          更新を見る
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          追跡中の作品で、新しい開発ログやプレイ可能版の更新です。
        </p>
      </div>

      {watchedGames.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 px-5 py-10 text-center">
          <p className="text-sm text-zinc-500">
            追跡中の作品がないため、更新は表示されません。
          </p>
          <p className="mt-2 text-xs text-zinc-600">
            気になる作品の詳細から「更新を追う」を押すと、ここに表示されます。
          </p>
        </div>
      ) : updates.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 px-5 py-10 text-center">
          <p className="text-sm text-zinc-500">
            まだ表示できる更新がありません。
          </p>
          <Link
            href="/notifications"
            className="mt-3 inline-block text-sm font-medium text-orange-400 transition-colors hover:text-orange-300"
          >
            通知一覧を見る →
          </Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {updates.slice(0, 8).map((update) => (
            <li key={update.id}>
              <article className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={
                      update.kind === "version_published"
                        ? "rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[11px] font-medium text-orange-400"
                        : "rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400"
                    }
                  >
                    {update.label}
                  </span>
                  <time
                    dateTime={update.date}
                    className="text-xs text-zinc-600"
                  >
                    {formatNotificationDate(update.date)}
                  </time>
                </div>
                <p className="mt-2 text-sm font-medium text-zinc-200">
                  {update.game.title}
                </p>
                <p className="mt-1 text-sm text-zinc-500">{update.message}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium">
                  <Link
                    href={update.historyHref}
                    className="text-orange-400 transition-colors hover:text-orange-300"
                  >
                    開発の歩みを見る →
                  </Link>
                  <Link
                    href={update.replayHref}
                    className="text-zinc-400 transition-colors hover:text-zinc-200"
                  >
                    {update.kind === "version_published"
                      ? "新版をプレイ →"
                      : "作品詳細へ →"}
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
