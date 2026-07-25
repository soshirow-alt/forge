"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import {
  PROJECT_CATEGORY_LABELS,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import type { GlobalSearchResult } from "@/lib/supabase/public-catalog-db";

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; results: GlobalSearchResult[] };

function GlobalSearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const [state, setState] = useState<LoadState>({ status: "idle" });

  useEffect(() => {
    if (!query) {
      return;
    }

    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) {
        setState({ status: "loading" });
      }
    });

    void fetch(`/api/search/global?q=${encodeURIComponent(query)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("global search failed");
        }
        const payload = (await response.json()) as {
          ok?: boolean;
          results?: GlobalSearchResult[];
        };
        if (!payload.ok) {
          throw new Error("global search payload invalid");
        }
        if (!cancelled) {
          setState({ status: "ready", results: payload.results ?? [] });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: "error" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  const results = state.status === "ready" ? state.results : [];
  const loading = Boolean(query) && state.status !== "ready" && state.status !== "error";
  const error = state.status === "error";

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-white">
        {query ? `「${query}」の検索結果` : "全体検索"}
      </h1>

      {!query ? (
        <p className="text-sm text-zinc-500">検索キーワードを入力してください。</p>
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-xl border border-zinc-800/80 bg-zinc-900/40"
            />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-zinc-500">検索結果を取得できませんでした。</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-zinc-500">条件に合う結果がありません。</p>
      ) : (
        <ul className="space-y-2">
          {results.map((item) => {
            const href =
              item.kind === "project"
                ? gameDetailHref(item.id)
                : item.kind === "developer"
                  ? `/developers/${item.id}`
                  : `/search/global?q=${encodeURIComponent(item.title)}`;
            const kindLabel =
              item.kind === "project"
                ? "作品"
                : item.kind === "developer"
                  ? "開発者"
                  : "タグ";
            const categoryLabel =
              item.category && item.category in PROJECT_CATEGORY_LABELS
                ? PROJECT_CATEGORY_LABELS[item.category as ProjectCategoryId]
                : null;

            return (
              <li key={`${item.kind}:${item.id}`}>
                <Link
                  href={href}
                  className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-3 py-2.5 transition-colors hover:border-zinc-700"
                >
                  {item.kind === "project" ? (
                    <ProjectThumbnail
                      projectId={item.id}
                      title={item.title}
                      variant="card"
                      className="size-12 shrink-0 rounded-lg"
                    />
                  ) : (
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-[11px] text-zinc-400">
                      {kindLabel}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-zinc-100">
                        {item.title}
                      </span>
                      <span className="rounded-md bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-400">
                        {kindLabel}
                      </span>
                      {categoryLabel ? (
                        <span className="rounded-md bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-400">
                          {categoryLabel}
                        </span>
                      ) : null}
                    </span>
                    {item.subtitle ? (
                      <span className="mt-0.5 line-clamp-1 block text-xs text-zinc-500">
                        {item.subtitle}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function PlayerIaGlobalSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="h-40 animate-pulse rounded-2xl border border-zinc-800/80 bg-zinc-900/40" />
      }
    >
      <GlobalSearchContent />
    </Suspense>
  );
}
