"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import { PlayerShell } from "@/components/player-shell";
import {
  getExtraPlayerNotifications,
  subscribeV0Notifications,
} from "@/lib/community-join-v0-store";
import { notificationToV0Item } from "@/lib/notification-v0-adapter";
import {
  countUnread,
  filterNotifications,
  notificationFilterTabs,
  type NotificationFilterId,
  type NotificationKind,
  type NotificationV0Item,
} from "@/lib/notifications-v0-mock-data";
import {
  Bell,
  CheckCheck,
  Flag,
  Heart,
  Megaphone,
  MessageSquare,
  SlidersHorizontal,
  Star,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

function kindIcon(kind: NotificationKind) {
  const className = "size-4";
  switch (kind) {
    case "empathy":
      return <Heart className={className} aria-hidden="true" />;
    case "developer_reply":
    case "new_feedback":
      return <MessageSquare className={className} aria-hidden="true" />;
    case "update":
      return <TrendingUp className={className} aria-hidden="true" />;
    case "follow":
      return <UserPlus className={className} aria-hidden="true" />;
    case "milestone":
      return <Star className={className} aria-hidden="true" />;
    case "developer_post":
      return <Megaphone className={className} aria-hidden="true" />;
    case "community_join_approved":
    case "community_join_rejected":
      return <Users className={className} aria-hidden="true" />;
    case "system":
      return <Flag className={className} aria-hidden="true" />;
    default:
      return <Bell className={className} aria-hidden="true" />;
  }
}

function kindIconClass(kind: NotificationKind): string {
  switch (kind) {
    case "empathy":
      return "bg-rose-500/15 text-rose-300 ring-rose-500/30";
    case "developer_reply":
    case "new_feedback":
      return "bg-violet-500/15 text-violet-300 ring-violet-500/30";
    case "update":
      return "bg-sky-500/15 text-sky-300 ring-sky-500/30";
    case "follow":
      return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30";
    case "milestone":
      return "bg-amber-500/15 text-amber-300 ring-amber-500/30";
    case "developer_post":
      return "bg-indigo-500/15 text-indigo-300 ring-indigo-500/30";
    case "community_join_approved":
      return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30";
    case "community_join_rejected":
      return "bg-zinc-700/50 text-zinc-400 ring-zinc-600/50";
    case "system":
      return "bg-zinc-700/50 text-zinc-400 ring-zinc-600/50";
    default:
      return "bg-zinc-800 text-zinc-400 ring-zinc-700";
  }
}

function NotificationRow({
  item,
  onMarkRead,
}: {
  item: NotificationV0Item;
  onMarkRead: (id: string) => void;
}) {
  const content = (
    <>
      <span
        className={`mt-2 size-2 shrink-0 rounded-full ${
          item.read ? "bg-zinc-700" : "bg-violet-500"
        }`}
        aria-hidden="true"
      />
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ${kindIconClass(item.kind)}`}
      >
        {kindIcon(item.kind)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-white">{item.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500">{item.body}</p>
        <p className="mt-2 text-xs text-zinc-600">{item.timeLabel}</p>
      </div>
      {item.thumbnail && (
        <span className="relative hidden h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-800 sm:block">
          <Image src={item.thumbnail} alt="" fill className="object-cover" />
        </span>
      )}
      {item.avatar && !item.thumbnail && (
        <span className="relative hidden size-10 shrink-0 overflow-hidden rounded-full bg-zinc-800 sm:block">
          <Image src={item.avatar} alt="" fill className="object-cover" />
        </span>
      )}
    </>
  );

  const className =
    "flex gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700/80 hover:bg-zinc-900/50";

  if (item.href) {
    return (
      <Link href={item.href} className={className} onClick={() => onMarkRead(item.id)}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={`${className} w-full text-left`} onClick={() => onMarkRead(item.id)}>
      {content}
    </button>
  );
}

function NotificationSection({
  title,
  items,
  onMarkRead,
}: {
  title: string;
  items: NotificationV0Item[];
  onMarkRead: (id: string) => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-zinc-400">{title}</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <NotificationRow item={item} onMarkRead={onMarkRead} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function NotificationsV0Page() {
  const { user, hydrated } = useAuth();
  const {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    reloadNotifications,
    getUnreadNotificationCount,
  } = useGames();
  const [filter, setFilter] = useState<NotificationFilterId>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [communityExtras, setCommunityExtras] = useState<NotificationV0Item[]>([]);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hydrated || !user) {
      return;
    }
    void reloadNotifications();
  }, [hydrated, user, reloadNotifications]);

  useEffect(() => {
    function mergeExtras() {
      setCommunityExtras(getExtraPlayerNotifications());
    }
    mergeExtras();
    return subscribeV0Notifications(mergeExtras);
  }, []);

  const items = useMemo(() => {
    const dbItems = getNotifications().map(notificationToV0Item);
    const ids = new Set(dbItems.map((item) => item.id));
    const extras = communityExtras.filter((item) => !ids.has(item.id));
    return [...extras, ...dbItems];
  }, [communityExtras, getNotifications]);

  useEffect(() => {
    if (!sortMenuOpen) {
      return;
    }
    function handlePointerDown(event: MouseEvent) {
      if (!sortMenuRef.current?.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [sortMenuOpen]);

  const filtered = useMemo(() => {
    const list = filterNotifications(items, filter);
    return sortOrder === "oldest" ? [...list].reverse() : list;
  }, [items, filter, sortOrder]);
  const unread = filtered.filter((item) => !item.read);
  const read = filtered.filter((item) => item.read);

  function markRead(id: string) {
    markNotificationAsRead(id);
  }

  function markAllRead() {
    markAllNotificationsAsRead();
  }

  const unreadCount = user ? getUnreadNotificationCount() : countUnread(items);

  return (
    <PlayerShell activeNav="notifications" notificationBadge={unreadCount}>
      <div className="mx-auto max-w-3xl">
        <header>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              <Bell className="size-7 text-violet-400" aria-hidden="true" />
              通知
            </h1>
            <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-200">
              Player
            </span>
          </div>
        </header>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {notificationFilterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                filter === tab.id
                  ? "border-violet-500/40 bg-violet-500/10 text-violet-200"
                  : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 text-sm text-violet-400 transition-colors hover:text-violet-300"
          >
            <CheckCheck className="size-4" aria-hidden="true" />
            すべて既読にする
          </button>
          <div className="relative" ref={sortMenuRef}>
            <button
              type="button"
              onClick={() => setSortMenuOpen((open) => !open)}
              className={`rounded-lg border p-2 transition-colors ${
                sortMenuOpen
                  ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                  : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              }`}
              aria-label="表示オプション"
              aria-expanded={sortMenuOpen}
            >
              <SlidersHorizontal className="size-4" />
            </button>
            {sortMenuOpen && (
              <div
                className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-zinc-800 bg-zinc-950 py-2 shadow-xl"
                role="menu"
              >
                <p className="px-3 py-1.5 text-xs font-medium text-zinc-500">並び替え</p>
                {(
                  [
                    { id: "newest" as const, label: "新しい順" },
                    { id: "oldest" as const, label: "古い順" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={sortOrder === option.id}
                    onClick={() => {
                      setSortOrder(option.id);
                      setSortMenuOpen(false);
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm transition-colors ${
                      sortOrder === option.id
                        ? "bg-violet-600/15 text-violet-200"
                        : "text-zinc-300 hover:bg-zinc-900"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 space-y-8">
          <NotificationSection title="未読" items={unread} onMarkRead={markRead} />
          <NotificationSection title="既読" items={read} onMarkRead={markRead} />
          {filtered.length === 0 && (
            <p className="rounded-2xl border border-dashed border-zinc-800 px-6 py-16 text-center text-sm text-zinc-500">
              該当する通知はありません。
            </p>
          )}
        </div>

        <p className="mt-10 text-center text-xs text-zinc-600">通知は 30 日間保存されます。</p>
      </div>
    </PlayerShell>
  );
}
