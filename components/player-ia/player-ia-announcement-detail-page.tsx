"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPlayerIaRelativeTime } from "@/lib/player-ia/format";
import type { PlatformAnnouncement } from "@/lib/supabase/player-ia-home-db";

function splitAnnouncementParagraphs(body: string): string[] {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

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
      <div className="mx-auto h-48 max-w-[820px] animate-pulse rounded-2xl border border-zinc-800/80 bg-zinc-900/40" />
    );
  }

  if (notFound || !announcement) {
    return (
      <div className="mx-auto max-w-[820px] space-y-4">
        <p className="text-sm text-zinc-500">お知らせが見つかりません。</p>
        <Link href="/announcements" className="text-sm text-violet-400 hover:text-violet-300">
          ← お知らせ一覧へ戻る
        </Link>
      </div>
    );
  }

  const paragraphs = splitAnnouncementParagraphs(announcement.body);
  const [lead, ...rest] = paragraphs.length > 0 ? paragraphs : [announcement.body];

  return (
    <article className="mx-auto w-full max-w-[820px] space-y-8">
      <Link
        href="/announcements"
        className="inline-flex text-sm text-zinc-400 transition-colors hover:text-violet-300"
      >
        ← お知らせ一覧
      </Link>

      <header className="space-y-4 border-b border-zinc-800/80 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          {announcement.importance === "important" ? (
            <span className="rounded-md bg-violet-600/20 px-2 py-0.5 text-[10px] font-semibold text-violet-200 ring-1 ring-violet-500/40">
              重要
            </span>
          ) : (
            <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-300 ring-1 ring-zinc-700">
              お知らせ
            </span>
          )}
          <time
            className="text-xs text-zinc-500"
            dateTime={announcement.publishedAt}
          >
            {formatPlayerIaRelativeTime(announcement.publishedAt)}
          </time>
        </div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {announcement.title}
        </h1>
        {lead ? (
          <p className="text-pretty text-base leading-relaxed text-zinc-300 sm:text-lg">
            {lead}
          </p>
        ) : null}
      </header>

      <div className="space-y-5 text-pretty text-[15px] leading-7 text-zinc-300 sm:text-base sm:leading-8">
        {rest.map((paragraph, index) => (
          <p key={`${index}-${paragraph.slice(0, 24)}`} className="whitespace-pre-wrap">
            {paragraph}
          </p>
        ))}
      </div>

      {announcement.ctaLabel && announcement.ctaUrl ? (
        <p>
          <Link
            href={announcement.ctaUrl}
            className="text-sm font-medium text-violet-300 underline-offset-4 hover:text-violet-200 hover:underline"
          >
            {announcement.ctaLabel}
          </Link>
        </p>
      ) : null}

      <footer className="border-t border-zinc-800/80 pt-6">
        <Link
          href="/announcements"
          className="text-sm text-zinc-400 transition-colors hover:text-violet-300"
        >
          ← お知らせ一覧へ戻る
        </Link>
      </footer>
    </article>
  );
}
