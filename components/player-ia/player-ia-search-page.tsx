"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { PlayerIaCategoryTabs } from "@/components/player-ia/player-ia-category-tabs";
import { PlayerIaProjectCard } from "@/components/player-ia/player-ia-project-card";
import {
  ASSET_KIND_IDS,
  ASSET_KIND_LABELS,
  isProjectCategoryId,
  PROJECT_CATEGORY_LABELS,
  STREAM_POLICY_IDS,
  STREAM_POLICY_LABELS,
} from "@/lib/project-categories";
import {
  formatPlayerIaRelativeTime,
} from "@/lib/player-ia/format";
import type { CatalogProject } from "@/lib/supabase/public-catalog-db";
import { ChevronDown } from "lucide-react";

function parseBooleanParam(value: string | null): boolean {
  return value === "1" || value === "true";
}

function buildCatalogQuery(searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  const category = searchParams.get("category")?.trim();
  if (category && category !== "all" && isProjectCategoryId(category)) {
    params.set("category", category);
  }
  const sort = searchParams.get("sort")?.trim();
  if (sort) {
    params.set("sort", sort);
  }
  if (parseBooleanParam(searchParams.get("quick_try"))) {
    params.set("quick_try", "1");
  }
  if (parseBooleanParam(searchParams.get("feedback_wanted"))) {
    params.set("feedback_wanted", "1");
  }
  if (parseBooleanParam(searchParams.get("usable_for_creation"))) {
    params.set("usable_for_creation", "1");
  }
  const streamPolicy = searchParams.get("stream_policy")?.trim();
  if (streamPolicy) {
    params.set("stream_policy", streamPolicy);
  }
  const assetKind = searchParams.get("asset_kind")?.trim();
  if (assetKind) {
    params.set("asset_kind", assetKind);
  }
  params.set("limit", "48");
  return params.toString();
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

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 items-center rounded-lg border px-2.5 text-xs font-medium transition-colors ${
        active
          ? "border-violet-500/50 bg-violet-600/20 text-violet-100"
          : "border-zinc-700/80 bg-zinc-900/70 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
      }`}
    >
      {label}
    </button>
  );
}

function PlayerIaSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<CatalogProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const category = useMemo(() => {
    const raw = searchParams.get("category")?.trim();
    return raw && isProjectCategoryId(raw) ? raw : null;
  }, [searchParams]);

  const catalogQuery = useMemo(
    () => buildCatalogQuery(searchParams),
    [searchParams],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
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
          setProjects(payload.projects ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setProjects([]);
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
  }, [catalogQuery]);

  const sort = searchParams.get("sort")?.trim() || "newest";
  const quickTry = parseBooleanParam(searchParams.get("quick_try"));
  const feedbackWanted = parseBooleanParam(searchParams.get("feedback_wanted"));
  const usableForCreation = parseBooleanParam(
    searchParams.get("usable_for_creation"),
  );
  const streamPolicy = searchParams.get("stream_policy")?.trim() || "";
  const assetKind = searchParams.get("asset_kind")?.trim() || "";

  const title = category
    ? PROJECT_CATEGORY_LABELS[category]
    : "すべての作品";

  return (
    <div>
      <Suspense fallback={null}>
        <PlayerIaCategoryTabs />
      </Suspense>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-white">{title}</h1>
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

      <div className="mb-5 flex flex-wrap gap-2">
        <FilterChip
          active={quickTry}
          label="すぐ試せる"
          onClick={() =>
            updateParam(
              router,
              searchParams,
              "quick_try",
              quickTry ? null : "1",
            )
          }
        />
        <FilterChip
          active={feedbackWanted}
          label="FB募集中"
          onClick={() =>
            updateParam(
              router,
              searchParams,
              "feedback_wanted",
              feedbackWanted ? null : "1",
            )
          }
        />
        <FilterChip
          active={usableForCreation}
          label="制作に使える"
          onClick={() =>
            updateParam(
              router,
              searchParams,
              "usable_for_creation",
              usableForCreation ? null : "1",
            )
          }
        />
      </div>

      {category === "game" ? (
        <div className="mb-5 flex flex-wrap gap-2">
          {STREAM_POLICY_IDS.filter((id) => id !== "unset").map((id) => (
            <FilterChip
              key={id}
              active={streamPolicy === id}
              label={STREAM_POLICY_LABELS[id]}
              onClick={() =>
                updateParam(
                  router,
                  searchParams,
                  "stream_policy",
                  streamPolicy === id ? null : id,
                )
              }
            />
          ))}
        </div>
      ) : null}

      {category === "asset" ? (
        <div className="mb-5 flex flex-wrap gap-2">
          {ASSET_KIND_IDS.map((id) => (
            <FilterChip
              key={id}
              active={assetKind === id}
              label={ASSET_KIND_LABELS[id]}
              onClick={() =>
                updateParam(
                  router,
                  searchParams,
                  "asset_kind",
                  assetKind === id ? null : id,
                )
              }
            />
          ))}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-48 animate-pulse rounded-2xl border border-zinc-800/80 bg-zinc-900/40"
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <PlayerIaProjectCard
              key={project.projectId}
              projectId={project.projectId}
              title={project.title}
              category={project.category}
              creator={project.creator}
              meta={
                sort === "updated" && project.meaningfulUpdateAt
                  ? `更新 ${formatPlayerIaRelativeTime(project.meaningfulUpdateAt)}`
                  : formatPlayerIaRelativeTime(project.firstPublishedAt)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PlayerIaSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-48 animate-pulse rounded-2xl border border-zinc-800/80 bg-zinc-900/40"
            />
          ))}
        </div>
      }
    >
      <PlayerIaSearchContent />
    </Suspense>
  );
}
