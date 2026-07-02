"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FeatureComingSoonPanel } from "@/components/feature-coming-soon-panel";
import { StudioShell } from "@/components/studio-shell";
import { getExtraStudioNotifications, subscribeV0Notifications } from "@/lib/community-join-v0-store";
import { shouldHideV0MockContent } from "@/lib/production-mode";
import {
  countStudioUnread,
  studioNotificationHref,
  studioNotifications,
  type StudioNotificationItem,
} from "@/lib/studio-notifications-v0-mock-data";
import { MessageSquare, Play, Users } from "lucide-react";

function kindIcon(kind: StudioNotificationItem["kind"]) {
  const className = "size-4";
  switch (kind) {
    case "new_voice":
      return <MessageSquare className={className} aria-hidden="true" />;
    case "witness":
      return <Users className={className} aria-hidden="true" />;
    case "version_play":
      return <Play className={className} aria-hidden="true" />;
    case "community_join_request":
      return <Users className={className} aria-hidden="true" />;
  }
}

function kindClass(kind: StudioNotificationItem["kind"]): string {
  switch (kind) {
    case "new_voice":
      return "bg-red-500/15 text-red-400 ring-red-500/25";
    case "witness":
      return "bg-orange-500/15 text-orange-400 ring-orange-500/25";
    case "version_play":
      return "bg-sky-500/15 text-sky-400 ring-sky-500/25";
    case "community_join_request":
      return "bg-amber-500/15 text-amber-300 ring-amber-500/25";
  }
}

export function StudioNotificationsPage() {
  const hideV0Mock = shouldHideV0MockContent();
  const [items, setItems] = useState<StudioNotificationItem[]>(
    hideV0Mock ? [] : studioNotifications,
  );

  useEffect(() => {
    if (hideV0Mock) {
      return;
    }
    function mergeExtras() {
      const extras = getExtraStudioNotifications();
      if (extras.length === 0) {
        return;
      }
      setItems((current) => {
        const ids = new Set(current.map((item) => item.id));
        return [...extras.filter((item) => !ids.has(item.id)), ...current];
      });
    }
    mergeExtras();
    return subscribeV0Notifications(mergeExtras);
  }, [hideV0Mock]);

  const unread = countStudioUnread(items);

  function markRead(id: string) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, unread: false } : item)),
    );
  }

  return (
    <StudioShell activeNav="notifications">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Studio 通知（開発者向け）</h1>
            <p className="mt-1 text-sm text-zinc-500">
              届いたフィードバック・verのプレイ状況など。プレイヤー向けは{" "}
              <Link href="/notifications" className="text-violet-400 hover:text-violet-300">
                プレイヤー通知
              </Link>
              です。
            </p>
          </div>
          {unread > 0 && (
            <span className="rounded-full bg-violet-600/20 px-3 py-1 text-xs font-medium text-violet-200 ring-1 ring-violet-500/30">
              未読 {unread}
            </span>
          )}
        </header>

        {items.length === 0 ? (
          <div className="mt-8">
            {hideV0Mock ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 text-center">
                <p className="text-sm font-medium text-zinc-300">
                  Studio 向けの通知一覧は準備中です
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  届いた回答や更新のお知らせは、通知ページで確認できます。
                </p>
                <Link
                  href="/notifications"
                  className="mt-5 inline-flex rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 transition-colors hover:bg-violet-500/15"
                >
                  通知ページを開く
                </Link>
              </div>
            ) : (
              <FeatureComingSoonPanel
                title="通知はまだありません"
                description="確認用のサンプル通知が表示されています。"
              />
            )}
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {items.map((item) => (
            <li key={item.id}>
              <Link
                href={studioNotificationHref(item)}
                onClick={() => markRead(item.id)}
                className={`flex gap-4 rounded-2xl border px-4 py-4 transition-colors ${
                  item.unread
                    ? "border-violet-500/30 bg-violet-600/5 hover:bg-violet-600/10"
                    : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
                }`}
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ${kindClass(item.kind)}`}
                >
                  {kindIcon(item.kind)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-zinc-100">{item.title}</p>
                    {item.unread && (
                      <span className="size-2 rounded-full bg-violet-400" aria-label="未読" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">{item.body}</p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {item.projectTitle} · {item.timeLabel}
                  </p>
                </div>
              </Link>
            </li>
          ))}
          </ul>
        )}
      </div>
    </StudioShell>
  );
}
