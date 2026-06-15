"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ForgeHeader } from "@/components/forge-header";
import { useGames } from "@/components/games-provider";
import { LOGIN_PATH } from "@/hooks/use-require-auth";
import {
  formatNotificationDate,
  getNotificationTypeLabel,
} from "@/lib/notifications";
import { notificationTargetHref } from "@/lib/project-nurture-links";

type NotificationFilter = "all" | "unread" | "read";

const filterOptions: { value: NotificationFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "unread", label: "未読" },
  { value: "read", label: "既読" },
];

export function NotificationsPage() {
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUnreadNotificationCount,
    reloadNotifications,
  } = useGames();
  const [filter, setFilter] = useState<NotificationFilter>("all");

  useEffect(() => {
    if (hydrated && user) {
      void reloadNotifications();
    }
  }, [hydrated, user, reloadNotifications]);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace(LOGIN_PATH);
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="min-h-full bg-zinc-950 text-zinc-100">
        <ForgeHeader />
        <main className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-zinc-500">読み込み中...</p>
        </main>
      </div>
    );
  }

  const notifications = getNotifications();
  const unreadCount = getUnreadNotificationCount();

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((notification) => !notification.read);
    }

    if (filter === "read") {
      return notifications.filter((notification) => notification.read);
    }

    return notifications;
  }, [filter, notifications]);

  function handleNotificationClick(id: string) {
    markNotificationAsRead(id);
  }

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <ForgeHeader />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <Link
          href="/"
          className="text-sm text-zinc-500 transition-colors hover:text-orange-400"
        >
          ← 作品一覧に戻る
        </Link>

        <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">通知</h1>
            <p className="mt-2 text-zinc-500">
              作品に関する最新のアクティビティを確認できます。
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-orange-500/50 hover:bg-zinc-900 hover:text-white"
            >
              すべて既読にする
            </button>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={
                  filter === option.value
                    ? "rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-medium text-zinc-950"
                    : "rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-orange-500/50 hover:bg-zinc-900 hover:text-white"
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-16 text-center">
            <p className="text-zinc-400">通知はまだありません</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-16 text-center">
            <p className="text-zinc-400">
              {filter === "unread"
                ? "未読の通知はありません"
                : "既読の通知はありません"}
            </p>
          </div>
        ) : (
          <ul className="mt-10 space-y-4">
            {filteredNotifications.map((notification) => (
              <li key={notification.id}>
                <Link
                  href={notificationTargetHref(notification)}
                  onClick={() => handleNotificationClick(notification.id)}
                  className="block rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 transition-colors hover:border-orange-500/50 hover:bg-zinc-900"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-400">
                        {getNotificationTypeLabel(notification.type)}
                      </span>
                      <span
                        className={
                          notification.read
                            ? "rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-400"
                            : "rounded-full bg-orange-500/20 px-3 py-1 text-xs font-medium text-orange-300"
                        }
                      >
                        {notification.read ? "既読" : "未読"}
                      </span>
                    </div>
                    <time
                      dateTime={notification.date}
                      className="text-sm text-zinc-500"
                    >
                      {formatNotificationDate(notification.date)}
                    </time>
                  </div>
                  <p className="mt-3 text-zinc-200">{notification.message}</p>
                  <span className="mt-3 inline-block text-sm font-medium text-orange-400">
                    {notification.projectTitle}
                    {notification.type === "devlog" ||
                    notification.type === "version_published"
                      ? " — 開発の歩みを見る →"
                      : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
