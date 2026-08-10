"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConsultationThread } from "@/components/consultation-thread";
import { ProfileAvatar } from "@/components/profile-avatar";
import { useGames } from "@/components/games-provider";
import type { CollabConsultationSummary } from "@/lib/collab/consultation-types";

function shortUserId(userId: string): string {
  return userId.length > 8 ? `${userId.slice(0, 8)}…` : userId;
}

function formatListTime(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function ConversationListItem({
  item,
  selected,
  displayName,
  avatarUrl,
}: {
  item: CollabConsultationSummary;
  selected: boolean;
  displayName: string;
  avatarUrl?: string | null;
}) {
  const initial = displayName.trim().slice(0, 1) || "?";
  return (
    <Link
      href={`/messages/${item.consultationId}`}
      className={`flex gap-3 rounded-xl border px-3 py-3 transition-colors ${
        selected
          ? "border-violet-500/50 bg-violet-500/10"
          : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
      }`}
    >
      <div className="relative shrink-0">
        {avatarUrl ? (
          <ProfileAvatar
            src={avatarUrl}
            userId={item.counterpartId}
            className="size-10"
            size={40}
          />
        ) : (
          <span
            className="flex size-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-300"
            aria-hidden="true"
          >
            {initial}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-medium text-white">{displayName}</p>
          <div className="flex shrink-0 items-center gap-2">
            {item.lastMessageAt ? (
              <time className="text-[11px] text-zinc-500" dateTime={item.lastMessageAt}>
                {formatListTime(item.lastMessageAt)}
              </time>
            ) : null}
            {item.unreadCount > 0 ? (
              <span className="rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {item.unreadCount > 9 ? "9+" : item.unreadCount}
              </span>
            ) : null}
          </div>
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500">
          {item.lastMessageBody ?? "メッセージはありません"}
        </p>
      </div>
    </Link>
  );
}

export function MessagesInboxPage({
  selectedId = null,
  notice = null,
}: {
  selectedId?: string | null;
  notice?: string | null;
}) {
  const { getDeveloperProfileByUserId } = useGames();
  const [consultations, setConsultations] = useState<CollabConsultationSummary[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [listFailed, setListFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve()
      .then(async () => {
        const response = await fetch("/api/collab/consultations", { cache: "no-store" });
        if (!response.ok) throw new Error("メッセージを読み込めませんでした。");
        const result = (await response.json()) as {
          consultations: CollabConsultationSummary[];
        };
        if (cancelled) return;
        setConsultations(result.consultations);
        setListFailed(false);
        setError("");
      })
      .catch((cause) => {
        if (!cancelled) {
          setListFailed(true);
          setError(cause instanceof Error ? cause.message : "読み込めませんでした。");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const showUnavailableNotice = notice === "unavailable";

  const listPane = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-zinc-800/80 px-3 pt-4 pb-3">
        <h1 className="text-lg font-semibold text-white">メッセージ</h1>
        <p className="mt-1 text-xs text-zinc-500">利用・コラボについてのやり取り</p>
      </div>
      {showUnavailableNotice ? (
        <p className="mx-1 mt-3 rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-300">
          このメッセージは現在表示できません
        </p>
      ) : null}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto py-4">
        {loading ? (
          <p className="px-1 text-sm text-zinc-500">読み込み中…</p>
        ) : consultations.length ? (
          consultations.map((item) => {
            const profile = getDeveloperProfileByUserId(item.counterpartId);
            const displayName =
              profile?.publicName?.trim() || shortUserId(item.counterpartId);
            return (
              <ConversationListItem
                key={item.consultationId}
                item={item}
                selected={selectedId === item.consultationId}
                displayName={displayName}
                avatarUrl={profile?.avatarUrl}
              />
            );
          })
        ) : listFailed ? null : (
          <p className="px-1 py-6 text-center text-sm leading-relaxed text-zinc-500">
            メッセージはまだありません。
            <br />
            <span className="text-xs text-zinc-600">
              作品詳細の「利用・コラボについて相談」から開始できます
            </span>
          </p>
        )}
        {error ? <p className="px-1 text-sm text-red-300">{error}</p> : null}
      </div>
    </div>
  );

  return (
    <div className="grid w-full gap-4 lg:h-[calc(100vh-8rem)] lg:grid-cols-[minmax(260px,320px)_1fr]">
      <aside
        className={`min-h-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 ${
          selectedId ? "hidden lg:block" : ""
        }`}
      >
        {listPane}
      </aside>
      <section
        className={`min-h-0 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 ${
          selectedId ? "" : "hidden lg:flex lg:items-center lg:justify-center lg:border-dashed"
        }`}
      >
        {selectedId ? (
          <ConsultationThread
            key={selectedId}
            consultationId={selectedId}
            embedded
          />
        ) : (
          <p className="text-sm text-zinc-500">会話を選ぶとここに表示されます</p>
        )}
      </section>
    </div>
  );
}
