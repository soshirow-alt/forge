"use client";

import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  FeaturedGameCarousel,
  type FeaturedThumbnailsState,
} from "@/components/featured/featured-game-carousel";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import { buildGameDetailTabHref } from "@/lib/game-detail-tabs";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import {
  formatPlayerIaRelativeTime,
  formatPlayerIaVersionLabel,
  truncatePlayerIaText,
} from "@/lib/player-ia/format";
import {
  buildFeaturedHeroThumbnailById,
  capFeaturedHeroThumbnailIds,
  resolveFeaturedCarouselThumbnails,
} from "@/lib/player-ia/featured-hero-thumbnails";
import { createRequestNowMs } from "@/lib/player-ia/request-now";
import type { PlayerIaGameHomePayload } from "@/lib/supabase/player-ia-home-db";

const GAME_SEARCH_HREF = "/search?category=game";

function createClientFallbackNowMs(): number {
  return createRequestNowMs();
}

async function fetchHeroThumbnailPathsById(
  heroIds: string[],
): Promise<Record<string, string[]>> {
  const ids = capFeaturedHeroThumbnailIds(heroIds);
  if (ids.length === 0) return {};

  const response = await fetch(
    `/api/public/projects/thumbnail-counts?ids=${ids.map(encodeURIComponent).join(",")}`,
    { method: "GET", cache: "no-store", credentials: "same-origin" },
  );
  if (!response.ok) {
    throw new Error(`hero thumbnail counts failed (${response.status})`);
  }
  const payload = (await response.json()) as {
    ok?: boolean;
    counts?: Record<string, number>;
  };
  if (!payload.ok || !payload.counts) {
    throw new Error("hero thumbnail counts failed");
  }

  return buildFeaturedHeroThumbnailById(ids, payload.counts);
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

export function PlayerIaGameHomePage({
  initialHome = null,
  nowMs,
}: {
  initialHome?: PlayerIaGameHomePayload | null;
  nowMs?: number;
}) {
  const [fallbackNowMs] = useState(createClientFallbackNowMs);
  const displayNowMs = nowMs ?? fallbackNowMs;
  const [clientHome, setClientHome] = useState<PlayerIaGameHomePayload | null>(
    null,
  );
  const [clientLoading, setClientLoading] = useState(initialHome == null);
  const [clientError, setClientError] = useState(false);
  const [heroThumbnails, setHeroThumbnails] = useState<{
    forKey: string;
    state: FeaturedThumbnailsState;
  }>({ forKey: "", state: { status: "ready", byId: {} } });

  useEffect(() => {
    if (initialHome) return;
    let cancelled = false;
    void fetch("/api/discovery/player-ia-game-home", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("game home fetch failed");
        const payload = (await response.json()) as {
          ok?: boolean;
          home?: PlayerIaGameHomePayload;
        };
        if (!payload.ok || !payload.home) throw new Error("invalid payload");
        if (!cancelled) {
          setClientHome(payload.home);
          setClientError(false);
        }
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
  }, [initialHome]);

  const home = initialHome ?? clientHome;
  const loading = initialHome ? false : clientLoading;
  const error = initialHome ? false : clientError;
  const heroIds = useMemo(
    () => (home?.featuredHero ?? []).map((card) => card.id),
    [home],
  );
  const heroKey = heroIds.join(",");

  useEffect(() => {
    if (heroIds.length === 0) return;
    const key = heroIds.join(",");
    let cancelled = false;
    void fetchHeroThumbnailPathsById(heroIds)
      .then((byId) => {
        if (!cancelled) {
          setHeroThumbnails({ forKey: key, state: { status: "ready", byId } });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHeroThumbnails({ forKey: key, state: { status: "error" } });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [heroIds]);

  const carouselThumbnails = resolveFeaturedCarouselThumbnails(
    heroIds,
    heroIds.length === 0
      ? { status: "ready", byId: {} }
      : heroThumbnails.forKey === heroKey
        ? heroThumbnails.state
        : { status: "loading" },
  );
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
          ゲームホームを読み込めませんでした。
        </p>
        <Link
          href={GAME_SEARCH_HREF}
          className="mt-4 inline-flex text-sm font-medium text-violet-300 hover:text-violet-200"
        >
          条件で探す
        </Link>
      </div>
    );
  }

  const empty =
    home.featuredHero.length === 0 &&
    home.meaningfulUpdates.length === 0 &&
    home.newestProjects.length === 0;

  return (
    <div className="flex flex-col gap-10">
      {empty ? (
        <div className="mx-auto w-full max-w-[1400px] rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-12 text-center">
          <p className="text-sm text-zinc-400">
            まだ表示できるゲームがありません。
          </p>
          <Link
            href={GAME_SEARCH_HREF}
            className="mt-4 inline-flex text-sm font-medium text-violet-300 hover:text-violet-200"
          >
            条件で探す
          </Link>
        </div>
      ) : null}

      {home.featuredHero.length > 0 ? (
        <div className="-mx-4 w-[calc(100%+2rem)] sm:-mx-6 sm:w-[calc(100%+3rem)] lg:-mx-8 lg:w-[calc(100%+4rem)]">
          <FeaturedGameCarousel
            slides={home.featuredHero}
            thumbnails={carouselThumbnails}
            title="注目のゲーム"
            density="player-ia"
            seeAllHref={GAME_SEARCH_HREF}
          />
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-10">
        {home.meaningfulUpdates.length > 0 ? (
          <section aria-labelledby="game-home-updates">
            <SectionHeading
              title="最近アップデートされたゲーム"
              headingId="game-home-updates"
              seeAllHref="/search?category=game&sort=updated"
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
          <section aria-labelledby="game-home-newest">
            <SectionHeading
              title="新着ゲーム"
              headingId="game-home-newest"
              seeAllHref="/search?category=game&sort=newest"
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
    </div>
  );
}
