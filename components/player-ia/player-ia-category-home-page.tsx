"use client";

import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import { buildGameDetailTabHref } from "@/lib/game-detail-tabs";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import {
  formatPlayerIaRelativeTime,
  formatPlayerIaVersionLabel,
  truncatePlayerIaText,
} from "@/lib/player-ia/format";
import { createRequestNowMs } from "@/lib/player-ia/request-now";
import {
  PROJECT_CATEGORY_LABELS,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import type { PlayerIaCategoryHomePayload } from "@/lib/supabase/player-ia-home-db";

function createClientFallbackNowMs(): number {
  return createRequestNowMs();
}

function SectionHeading({
  title,
  headingId,
  seeAllHref,
}: {
  title: string;
  headingId: string;
  seeAllHref?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2
        id={headingId}
        className="text-lg font-bold tracking-tight text-white text-balance"
      >
        {title}
      </h2>
      {seeAllHref ? (
        <Link
          href={seeAllHref}
          className="group inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
        >
          すべて見る
          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}

export function PlayerIaCategoryHomePage({
  category,
  initialHome,
  nowMs,
}: {
  category: ProjectCategoryId;
  initialHome?: PlayerIaCategoryHomePayload | null;
  nowMs?: number;
}) {
  const label = PROJECT_CATEGORY_LABELS[category];
  const searchHref = `/search?category=${category}`;
  const [clientHome, setClientHome] = useState<PlayerIaCategoryHomePayload | null>(
    null,
  );
  const [clientLoading, setClientLoading] = useState(!initialHome);
  const [clientError, setClientError] = useState(false);
  const [displayNowMs] = useState(() => nowMs ?? createClientFallbackNowMs());

  useEffect(() => {
    if (initialHome) return;
    let cancelled = false;
    void fetch(
      `/api/discovery/player-ia-category-home?category=${encodeURIComponent(category)}`,
      { cache: "no-store" },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("category home failed");
        const payload = (await response.json()) as {
          home?: PlayerIaCategoryHomePayload;
        };
        if (!cancelled) setClientHome(payload.home ?? null);
      })
      .catch(() => {
        if (!cancelled) setClientError(true);
      })
      .finally(() => {
        if (!cancelled) setClientLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, initialHome]);

  const home = initialHome ?? clientHome;
  const loading = initialHome ? false : clientLoading;
  const error = initialHome ? false : clientError;

  if (loading) {
    return (
      <div className="flex flex-col gap-10">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-48 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/40"
          />
        ))}
      </div>
    );
  }

  if (error || !home) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-16 text-center">
        <Search className="mx-auto size-10 text-zinc-600" aria-hidden="true" />
        <p className="mt-4 text-sm text-zinc-400">
          {label}ホームを読み込めませんでした。
        </p>
        <Link
          href={searchHref}
          className="mt-4 inline-flex text-sm font-medium text-violet-300 hover:text-violet-200"
        >
          条件で探す
        </Link>
      </div>
    );
  }

  if (!home.hasPublicWork) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-16 text-center">
        <p className="text-sm text-zinc-400">{label}</p>
        <p className="mt-2 text-lg font-semibold text-white">Coming Soon</p>
        <Link
          href={searchHref}
          className="mt-4 inline-flex text-sm font-medium text-violet-300 hover:text-violet-200"
        >
          条件で探す
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-10">
      {home.spotlight.length > 0 ? (
        <section aria-labelledby="category-home-spotlight">
          <SectionHeading
            title={`注目の${label}`}
            headingId="category-home-spotlight"
            seeAllHref={searchHref}
          />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {home.spotlight.map((item) => (
              <Link
                key={item.projectId}
                href={gameDetailHref(item.projectId)}
                className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-colors hover:border-violet-500/40"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <ProjectThumbnail
                    projectId={item.projectId}
                    title={item.title}
                    variant="card"
                    className="!max-w-none rounded-none"
                    sizes="(min-width: 1024px) 22vw, 45vw"
                  />
                </div>
                <div className="p-3.5">
                  <h3 className="truncate text-sm font-bold text-white group-hover:text-violet-200">
                    {item.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                    {truncatePlayerIaText(item.description, 80)}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-zinc-500">
                    <span className="truncate">{item.creator}</span>
                    <span className="shrink-0">
                      {formatPlayerIaRelativeTime(item.firstPublishedAt, {
                        nowMs: displayNowMs,
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {home.meaningfulUpdates.length > 0 ? (
        <section aria-labelledby="category-home-updates">
          <SectionHeading
            title="最近アップデート"
            headingId="category-home-updates"
            seeAllHref={`/search?category=${category}&sort=updated`}
          />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {home.meaningfulUpdates.map((item) => {
              const versionLabel = formatPlayerIaVersionLabel(
                item.publishedVersion,
              );
              return (
                <Link
                  key={item.projectId}
                  href={
                    item.updateKind === "devlog"
                      ? buildGameDetailTabHref(item.projectId, "devlog")
                      : gameDetailHref(item.projectId)
                  }
                  className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-colors hover:border-violet-500/40"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <ProjectThumbnail
                      projectId={item.projectId}
                      title={item.title}
                      variant="card"
                      className="!max-w-none rounded-none"
                      sizes="(min-width: 1024px) 22vw, 45vw"
                    />
                  </div>
                  <div className="p-3.5">
                    <span className="inline-flex rounded-md bg-violet-500/15 px-2 py-0.5 text-[11px] font-semibold text-violet-300">
                      {item.updateLabel}
                    </span>
                    <h3 className="mt-2 truncate text-sm font-bold text-white group-hover:text-violet-200">
                      {item.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                      {truncatePlayerIaText(item.updateSummary, 80)}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] text-zinc-500">
                      {versionLabel ? <span>{versionLabel}</span> : null}
                      <span>
                        {formatPlayerIaRelativeTime(item.meaningfulUpdateAt, {
                          nowMs: displayNowMs,
                        })}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {home.newestProjects.length > 0 ? (
        <section aria-labelledby="category-home-newest">
          <SectionHeading
            title="新着"
            headingId="category-home-newest"
            seeAllHref={`/search?category=${category}&sort=newest`}
          />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {home.newestProjects.map((item) => (
              <Link
                key={item.projectId}
                href={gameDetailHref(item.projectId)}
                className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-colors hover:border-violet-500/40"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <ProjectThumbnail
                    projectId={item.projectId}
                    title={item.title}
                    variant="card"
                    className="!max-w-none rounded-none"
                    sizes="(min-width: 1024px) 22vw, 45vw"
                  />
                </div>
                <div className="p-3.5">
                  <h3 className="truncate text-sm font-bold text-white group-hover:text-violet-200">
                    {item.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                    {truncatePlayerIaText(item.description, 80)}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-zinc-500">
                    <span className="truncate">{item.creator}</span>
                    <span className="shrink-0">
                      {formatPlayerIaRelativeTime(item.firstPublishedAt, {
                        nowMs: displayNowMs,
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
