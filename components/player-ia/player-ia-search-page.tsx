"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { PlayerIaCategoryTabs } from "@/components/player-ia/player-ia-category-tabs";
import { PlayerIaProjectCard } from "@/components/player-ia/player-ia-project-card";
import {
  PlayerIaSearchFilterMobileTrigger,
  PlayerIaSearchFilterPanel,
} from "@/components/player-ia/player-ia-search-filter-panel";
import { isProjectCategoryId, PROJECT_CATEGORY_LABELS } from "@/lib/project-categories";
import {
  buildCatalogQueryString,
  PLAYER_IA_SEARCH_CATALOG_LIMIT,
} from "@/lib/player-ia/catalog-search-params";
import { formatPlayerIaRelativeTime } from "@/lib/player-ia/format";
import { createRequestNowMs } from "@/lib/player-ia/request-now";
import type { CatalogProject } from "@/lib/supabase/public-catalog-db";
import { ChevronDown } from "lucide-react";

function createClientFallbackNowMs(): number {
  return createRequestNowMs();
}

function updateParam(
  router: ReturnType<typeof useRouter>,
  searchParams: URLSearchParams,
  key: string,
  value: string | null,
) {
  const next = new URLSearchParams(searchParams.toString());
  if (!value) {
    next.delete(key);
  } else {
    next.set(key, value);
  }
  const query = next.toString();
  router.push(query ? `/search?${query}` : "/search");
}

function ResultsGrid({
  projects,
  sort,
  nowMs,
}: {
  projects: CatalogProject[];
  sort: string;
  nowMs: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
      {projects.map((project) => (
        <PlayerIaProjectCard
          key={project.projectId}
          projectId={project.projectId}
          title={project.title}
          category={project.category}
          description={project.description}
          creator={project.creator}
          meta={
            sort === "updated" && project.meaningfulUpdateAt
              ? `更新 ${formatPlayerIaRelativeTime(project.meaningfulUpdateAt, { nowMs })}`
              : formatPlayerIaRelativeTime(project.firstPublishedAt, { nowMs })
          }
        />
      ))}
    </div>
  );
}

function PlayerIaSearchContent({
  initialProjects,
  initialError,
  initialCatalogQuery,
  nowMs,
}: {
  initialProjects: CatalogProject[];
  initialError: boolean;
  initialCatalogQuery: string;
  nowMs: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const catalogQuery = useMemo(
    () =>
      buildCatalogQueryString(searchParams, {
        limit: PLAYER_IA_SEARCH_CATALOG_LIMIT,
      }),
    [searchParams],
  );

  const useServerData = catalogQuery === initialCatalogQuery;
  const [clientState, setClientState] = useState<{
    query: string;
    projects: CatalogProject[];
    error: boolean;
  } | null>(null);

  useEffect(() => {
    if (catalogQuery === initialCatalogQuery) {
      return;
    }

    let cancelled = false;
    void fetch(`/api/search/catalog?${catalogQuery}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("catalog fetch failed");
        }
        const payload = (await response.json()) as {
          ok?: boolean;
          projects?: CatalogProject[];
        };
        if (!payload.ok) {
          throw new Error("catalog payload invalid");
        }
        if (!cancelled) {
          setClientState({
            query: catalogQuery,
            projects: payload.projects ?? [],
            error: false,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setClientState({
            query: catalogQuery,
            projects: [],
            error: true,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [catalogQuery, initialCatalogQuery]);

  const projects = useServerData
    ? initialProjects
    : clientState?.query === catalogQuery
      ? clientState.projects
      : [];
  const loading = !useServerData && clientState?.query !== catalogQuery;
  const error = useServerData
    ? initialError
    : clientState?.query === catalogQuery
      ? clientState.error
      : false;
  const category = useMemo(() => {
    const raw = searchParams.get("category")?.trim();
    return raw && isProjectCategoryId(raw) ? raw : null;
  }, [searchParams]);

  const sort = searchParams.get("sort")?.trim() || "newest";
  const title = category
    ? PROJECT_CATEGORY_LABELS[category]
    : "すべての作品";
  const resultLabel = loading
    ? "読み込み中…"
    : error
      ? "読み込みエラー"
      : `表示 ${projects.length}件`;

  const navigate = (href: string) => {
    router.push(href);
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">{title}</h1>
          <p className="mt-1 text-sm text-zinc-500">{resultLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PlayerIaSearchFilterMobileTrigger
            category={category}
            sort={sort}
            searchParams={searchParams}
            onNavigate={navigate}
          />
          <label className="inline-flex items-center gap-2 text-sm text-zinc-400">
            <span>並び順</span>
            <span className="relative">
              <select
                value={sort}
                onChange={(event) =>
                  updateParam(router, searchParams, "sort", event.target.value)
                }
                className="h-9 appearance-none rounded-lg border border-zinc-800 bg-zinc-900/80 py-1.5 pl-3 pr-8 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
              >
                <option value="newest">新しい順</option>
                <option value="updated">更新順</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
                aria-hidden="true"
              />
            </span>
          </label>
        </div>
      </div>

      <Suspense fallback={null}>
        <PlayerIaCategoryTabs />
      </Suspense>

      {/*
        Legacy surface filters (quick_try / usable_for_creation / feedback_wanted /
        stream_policy) are intentionally not shown — no Studio write path for
        these 076 fields. RPC / direct URL params remain compatible.
        Five-category formal filters (asset_kind, audio kinds/moods/purposes,
        dev-tool/service-app kinds/environments/features, play_time/env/players,
        ...) ARE active and rendered generically in PlayerIaSearchFilterPanel
        via `getSearchAttrFilterSpecs` (project-formal-filter-registry.ts).
      */}

      <div className="mt-5 flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="h-56 animate-pulse rounded-2xl border border-zinc-800/80 bg-zinc-900/40"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-16 text-center text-sm text-zinc-500">
              作品一覧を読み込めませんでした。
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-16 text-center text-sm text-zinc-500">
              条件に合う作品がありません。
            </div>
          ) : (
            <ResultsGrid projects={projects} sort={sort} nowMs={nowMs} />
          )}
        </div>

        <div className="hidden xl:block">
          <PlayerIaSearchFilterPanel
            category={category}
            sort={sort}
            searchParams={searchParams}
            onNavigate={navigate}
          />
        </div>
      </div>
    </div>
  );
}

export function PlayerIaSearchPage({
  initialProjects = [],
  initialError = false,
  initialCatalogQuery = "",
  nowMs,
}: {
  initialProjects?: CatalogProject[];
  initialError?: boolean;
  initialCatalogQuery?: string;
  nowMs?: number;
}) {
  const [fallbackNowMs] = useState(createClientFallbackNowMs);
  const displayNowMs = nowMs ?? fallbackNowMs;
  return (
    <Suspense
      fallback={
        <div className="mx-auto grid max-w-[1400px] gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-56 animate-pulse rounded-2xl border border-zinc-800/80 bg-zinc-900/40"
            />
          ))}
        </div>
      }
    >
      <PlayerIaSearchContent
        initialProjects={initialProjects}
        initialError={initialError}
        initialCatalogQuery={initialCatalogQuery}
        nowMs={displayNowMs}
      />
    </Suspense>
  );
}
