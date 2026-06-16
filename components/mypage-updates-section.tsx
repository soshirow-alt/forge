"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useGames } from "@/components/games-provider";
import { sortDevlogsNewestFirst, type DevlogEntry } from "@/lib/devlogs";
import { formatNotificationDate, type Notification } from "@/lib/notifications";
import {
  buildPlayerUpdateBadgeLabel,
  buildPlayerUpdateHeadline,
  isVersionPublishDevlog,
} from "@/lib/player-update-display";
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
  isVersionPublish: boolean;
  badgeLabel: string;
  headline: string;
  date: string;
  detailsHref: string;
  replayHref: string;
};

function resolvePlayerUpdateContext(
  kind: WatchedUpdateItem["kind"],
  notification: Notification | undefined,
  latestDevlog: DevlogEntry | undefined,
): { isVersionPublish: boolean; publishedVersion?: string | null } {
  if (kind === "version_published") {
    return {
      isVersionPublish: true,
      publishedVersion:
        notification?.publishedVersion ?? latestDevlog?.publishedVersion,
    };
  }

  if (isVersionPublishDevlog(latestDevlog)) {
    return {
      isVersionPublish: true,
      publishedVersion: latestDevlog?.publishedVersion,
    };
  }

  return { isVersionPublish: false, publishedVersion: latestDevlog?.publishedVersion };
}

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

    const latestDevlog = sortDevlogsNewestFirst(
      getDevlogsByProject(notification.projectId),
    )[0];

    const kind =
      notification.type === "version_published" ? "version_published" : "devlog";

    const updateContext = resolvePlayerUpdateContext(
      kind,
      notification,
      latestDevlog,
    );

    items.set(notification.id, {
      id: notification.id,
      game,
      kind,
      isVersionPublish: updateContext.isVersionPublish,
      badgeLabel: buildPlayerUpdateBadgeLabel(updateContext),
      headline: buildPlayerUpdateHeadline(updateContext),
      date: notification.date,
      detailsHref:
        updateContext.isVersionPublish
          ? gameVersionBannerHref(notification.projectId)
          : gameHistoryHref(notification.projectId),
      replayHref:
        updateContext.isVersionPublish
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

    const updateContext = resolvePlayerUpdateContext("devlog", undefined, latestDevlog);
    const headline = buildPlayerUpdateHeadline(updateContext);

    const duplicateFromNotification = [...items.values()].some(
      (item) => item.game.id === game.id && item.headline === headline,
    );

    if (duplicateFromNotification) {
      continue;
    }

    items.set(fallbackId, {
      id: fallbackId,
      game,
      kind: "devlog",
      isVersionPublish: updateContext.isVersionPublish,
      badgeLabel: buildPlayerUpdateBadgeLabel(updateContext),
      headline,
      date: latestDevlog.date,
      detailsHref: gameHistoryHref(game.id),
      replayHref: gamePlayHref(game.id),
    });
  }

  return [...items.values()].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

const primaryUpdateButtonClassName =
  "inline-flex cursor-pointer items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition-opacity hover:opacity-90 sm:text-sm";

const secondaryUpdateLinkClassName =
  "inline-flex cursor-pointer items-center text-xs font-medium text-zinc-400 transition-colors hover:text-orange-300 sm:text-sm";

export function MyPageUpdatesSection({
  watchedGames,
  previewLimit,
}: {
  watchedGames: Game[];
  previewLimit?: number;
}) {
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

  const displayUpdates = previewLimit
    ? updates.slice(0, previewLimit)
    : updates.slice(0, 8);

  return (
    <section id="updates" className="scroll-mt-24">
      <div
        className={
          previewLimit
            ? "border-l-2 border-emerald-500 pl-3"
            : "border-l-2 border-emerald-500 pl-4"
        }
      >
        <h2
          className={
            previewLimit
              ? "text-base font-semibold tracking-tight text-zinc-100"
              : "text-xl font-semibold tracking-tight text-zinc-100"
          }
        >
          前回プレイ後の更新
        </h2>
        <p
          className={
            previewLimit
              ? "mt-1 text-xs leading-relaxed text-zinc-500"
              : "mt-1 text-sm text-zinc-500"
          }
        >
          前回遊んだあと、あなたに起きた変化を確認できます。
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
            className="mt-3 inline-block cursor-pointer text-sm font-medium text-orange-400 transition-colors hover:text-orange-300"
          >
            通知一覧を見る →
          </Link>
        </div>
      ) : (
        <ul className={previewLimit ? "mt-4 space-y-2" : "mt-5 space-y-3"}>
          {displayUpdates.map((update) => (
            <li key={update.id}>
              <article className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={
                      update.isVersionPublish
                        ? "rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[11px] font-medium text-orange-400"
                        : "rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400"
                    }
                  >
                    {update.badgeLabel}
                  </span>
                  <time
                    dateTime={update.date}
                    className="text-xs text-zinc-600"
                  >
                    {formatNotificationDate(update.date)}
                  </time>
                </div>
                <p className="mt-2 text-base font-semibold text-zinc-100">
                  {update.headline}
                </p>
                <p className="mt-1 text-sm text-zinc-500">{update.game.title}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link href={update.replayHref} className={primaryUpdateButtonClassName}>
                    もう一度プレイする
                  </Link>
                  <Link href={update.detailsHref} className={secondaryUpdateLinkClassName}>
                    更新内容を見る →
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      {updates.length > 0 && (
        <p className={previewLimit ? "mt-3 text-xs text-zinc-600" : "mt-4 text-xs text-zinc-600"}>
          {previewLimit && updates.length > (previewLimit ?? 0) && (
            <>
              <Link
                href="/notifications"
                className="cursor-pointer text-orange-400/90 hover:text-orange-300"
              >
                通知一覧
              </Link>
              で全件確認 ·{" "}
            </>
          )}
          {!previewLimit && (
            <>
              すべての通知は
              <Link
                href="/notifications"
                className="mx-1 cursor-pointer text-orange-400/90 hover:text-orange-300"
              >
                通知一覧
              </Link>
              からも確認できます。
            </>
          )}
        </p>
      )}
    </section>
  );
}
