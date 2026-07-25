"use client";

import Link from "next/link";
import { Heart, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { PlayerIaProjectCard } from "@/components/player-ia/player-ia-project-card";
import { PlayerIaShelfSection } from "@/components/player-ia/player-ia-shelf-section";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import {
  formatPlayerIaRelativeTime,
  formatPlayerIaUpdateKind,
} from "@/lib/player-ia/format";
import {
  PROJECT_CATEGORY_LABELS,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import type { PlayerIaHomePayload } from "@/lib/supabase/player-ia-home-db";

const QUICK_FILTERS = [
  {
    label: "すぐ試せる",
    href: "/search?quick_try=1",
  },
  {
    label: "FB募集中",
    href: "/search?feedback_wanted=1",
  },
  {
    label: "制作に使える",
    href: "/search?usable_for_creation=1",
  },
] as const;

function ReviewHighlightCard({
  item,
}: {
  item: PlayerIaHomePayload["reviewHighlights"][number];
}) {
  return (
    <Link
      href={gameDetailHref(item.projectId)}
      className="group flex h-full min-w-0 flex-col rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 transition-colors hover:border-violet-500/30 hover:bg-zinc-900/70"
    >
      <div className="flex min-w-0 items-start gap-3">
        <ProjectThumbnail
          projectId={item.projectId}
          title={item.projectTitle}
          variant="chip"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white group-hover:text-violet-200">
            {item.projectTitle}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {PROJECT_CATEGORY_LABELS[item.projectCategory]}
          </p>
        </div>
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-300">
        {item.bodyText}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-3 text-xs text-zinc-500">
        <span>{item.authorDisplayName}</span>
        <span className="inline-flex items-center gap-1">
          <Heart className="size-3.5 text-violet-400" aria-hidden="true" />
          {item.empathyCount}
        </span>
        <span>{formatPlayerIaRelativeTime(item.createdAt)}</span>
      </div>
    </Link>
  );
}

function UsageRelationCard({
  item,
}: {
  item: PlayerIaHomePayload["usageRelations"][number];
}) {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4">
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <Link
          href={gameDetailHref(item.sourceProjectId)}
          className="min-w-0 flex-1 truncate font-medium text-white hover:text-violet-200"
        >
          {item.sourceTitle}
        </Link>
        <span className="shrink-0 text-zinc-500">が使用</span>
        <Link
          href={gameDetailHref(item.targetProjectId)}
          className="min-w-0 flex-1 truncate font-medium text-white hover:text-violet-200"
        >
          {item.targetTitle}
        </Link>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-zinc-500">
        <span>{PROJECT_CATEGORY_LABELS[item.sourceCategory]}</span>
        <span>→</span>
        <span>{PROJECT_CATEGORY_LABELS[item.targetCategory]}</span>
      </div>
    </div>
  );
}

function AnnouncementList({
  items,
}: {
  items: PlayerIaHomePayload["announcements"];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="player-ia-announcements" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="player-ia-announcements" className="text-lg font-semibold text-white sm:text-xl">
          お知らせ
        </h2>
        <Link
          href="/announcements"
          className="shrink-0 text-sm text-violet-400 transition-colors hover:text-violet-300"
        >
          すべて見る →
        </Link>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
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
    </section>
  );
}

export function PlayerIaHomePage() {
  const [home, setHome] = useState<PlayerIaHomePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/discovery/player-ia-home", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("home fetch failed");
        }
        const payload = (await response.json()) as {
          ok?: boolean;
          home?: PlayerIaHomePayload;
        };
        if (!payload.ok || !payload.home) {
          throw new Error("home payload invalid");
        }
        if (!cancelled) {
          setHome(payload.home);
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
      <div className="space-y-6">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-2xl border border-zinc-800/80 bg-zinc-900/40"
          />
        ))}
      </div>
    );
  }

  if (error || !home) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-16 text-center">
        <MessageSquare className="mx-auto size-10 text-zinc-600" aria-hidden="true" />
        <p className="mt-4 text-sm text-zinc-400">ホームを読み込めませんでした。</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {home.reviewHighlights.length > 0 ? (
        <section aria-labelledby="player-ia-reviews" className="space-y-3">
          <h2 id="player-ia-reviews" className="text-lg font-semibold text-white sm:text-xl">
            みんなのフィードバックから見つける
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {home.reviewHighlights.map((item) => (
              <ReviewHighlightCard key={item.cardId} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="player-ia-quick-filters" className="space-y-3">
        <h2 id="player-ia-quick-filters" className="text-lg font-semibold text-white sm:text-xl">
          探し方
        </h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_FILTERS.map((filter) => (
            <Link
              key={filter.href}
              href={filter.href}
              className="inline-flex h-9 items-center rounded-lg border border-zinc-700/80 bg-zinc-900/70 px-3 text-sm font-medium text-zinc-200 transition-colors hover:border-violet-500/40 hover:bg-zinc-800 hover:text-white"
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </section>

      <PlayerIaShelfSection
        title="最近の更新"
        headingId="player-ia-updates"
        items={home.meaningfulUpdates}
        getKey={(item) => item.projectId}
        seeAllHref="/search?sort=updated"
        seeAllLabel="すべて見る"
        renderItem={(item) => (
          <PlayerIaProjectCard
            projectId={item.projectId}
            title={item.title}
            category={item.category}
            meta={`${formatPlayerIaUpdateKind(item.updateKind)} · ${formatPlayerIaRelativeTime(item.meaningfulUpdateAt)}`}
          />
        )}
      />

      {home.usageRelations.length > 0 ? (
        <section aria-labelledby="player-ia-usage" className="space-y-3">
          <h2 id="player-ia-usage" className="text-lg font-semibold text-white sm:text-xl">
            使用した関係
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {home.usageRelations.map((item) => (
              <UsageRelationCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      <AnnouncementList items={home.announcements} />

      <PlayerIaShelfSection
        title="新着"
        headingId="player-ia-newest"
        items={home.newestProjects}
        getKey={(item) => item.projectId}
        seeAllHref="/search?sort=newest"
        seeAllLabel="すべて見る"
        renderItem={(item) => (
          <PlayerIaProjectCard
            projectId={item.projectId}
            title={item.title}
            category={item.category as ProjectCategoryId}
            meta={formatPlayerIaRelativeTime(item.firstPublishedAt)}
            creator={item.creator}
          />
        )}
      />
    </div>
  );
}
