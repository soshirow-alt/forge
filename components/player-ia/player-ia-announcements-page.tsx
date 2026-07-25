"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPlayerIaRelativeTime } from "@/lib/player-ia/format";
import type { PlatformAnnouncement } from "@/lib/supabase/player-ia-home-db";

export function PlayerIaAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/announcements", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("announcements fetch failed");
        }
        const payload = (await response.json()) as {
          ok?: boolean;
          announcements?: PlatformAnnouncement[];
        };
        if (!payload.ok) {
          throw new Error("announcements payload invalid");
        }
        if (!cancelled) {
          setAnnouncements(payload.announcements ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded-xl border border-zinc-800/80 bg-zinc-900/40"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-zinc-500">お知らせを読み込めませんでした。</p>;
  }

  if (announcements.length === 0) {
    return <p className="text-sm text-zinc-500">お知らせはありません。</p>;
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-white">お知らせ</h1>
      <ul className="space-y-2">
        {announcements.map((item) => (
          <li key={item.id}>
            <Link
              href={`/announcements/${item.slug}`}
              className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-3 transition-colors hover:border-violet-500/30 hover:bg-zinc-900/70"
            >
              {item.importance === "important" ? (
                <span className="shrink-0 rounded-md bg-violet-600/20 px-2 py-0.5 text-[10px] font-semibold text-violet-200 ring-1 ring-violet-500/40">
                  重要
                </span>
              ) : null}
              <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">
                {item.title}
              </span>
              <span className="shrink-0 text-xs text-zinc-500">
                {formatPlayerIaRelativeTime(item.publishedAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
