"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPlayerIaRelativeTime } from "@/lib/player-ia/format";
import type { PlatformAnnouncement } from "@/lib/supabase/player-ia-home-db";

export function PlayerIaAnnouncementDetailPage({ slug }: { slug: string }) {
  const [announcement, setAnnouncement] = useState<PlatformAnnouncement | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/announcements/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (response.status === 404) {
          if (!cancelled) {
            setNotFound(true);
          }
          return;
        }
        if (!response.ok) {
          throw new Error("announcement fetch failed");
        }
        const payload = (await response.json()) as {
          ok?: boolean;
          announcement?: PlatformAnnouncement;
        };
        if (!payload.ok || !payload.announcement) {
          throw new Error("announcement payload invalid");
        }
        if (!cancelled) {
          setAnnouncement(payload.announcement);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNotFound(true);
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
  }, [slug]);

  if (loading) {
    return (
      <div className="h-48 animate-pulse rounded-2xl border border-zinc-800/80 bg-zinc-900/40" />
    );
  }

  if (notFound || !announcement) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-zinc-500">お知らせが見つかりません。</p>
        <Link href="/announcements" className="text-sm text-violet-400 hover:text-violet-300">
          一覧へ戻る
        </Link>
      </div>
    );
  }

  return (
    <article className="space-y-4">
      <Link href="/announcements" className="text-sm text-violet-400 hover:text-violet-300">
        ← お知らせ一覧
      </Link>
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {announcement.importance === "important" ? (
            <span className="rounded-md bg-violet-600/20 px-2 py-0.5 text-[10px] font-semibold text-violet-200 ring-1 ring-violet-500/40">
              重要
            </span>
          ) : null}
          <time className="text-xs text-zinc-500" dateTime={announcement.publishedAt}>
            {formatPlayerIaRelativeTime(announcement.publishedAt)}
          </time>
        </div>
        <h1 className="text-2xl font-semibold text-white">{announcement.title}</h1>
      </header>
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
        {announcement.body}
      </div>
      {announcement.ctaLabel && announcement.ctaUrl ? (
        <p>
          <Link
            href={announcement.ctaUrl}
            className="inline-flex rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
          >
            {announcement.ctaLabel}
          </Link>
        </p>
      ) : null}
    </article>
  );
}
