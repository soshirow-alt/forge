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

function GlobalSearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setError(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);
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
          setResults(payload.results ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setResults([]);
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
  }, [query]);

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
        <p className="text-sm text-zinc-500">検索に失敗しました。</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-zinc-500">該当する結果がありません。</p>
      ) : (
        <ul className="space-y-2">
          {results.map((item) => {
            const href =
              item.kind === "project"
                ? gameDetailHref(item.id)
                : item.kind === "developer"
                  ? `/creators/${encodeURIComponent(item.id)}`
                  : `/search/global?q=${encodeURIComponent(item.title)}`;

            return (
              <li key={`${item.kind}-${item.id}`}>
                <Link
                  href={href}
                  className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-3 transition-colors hover:border-violet-500/30 hover:bg-zinc-900/70"
                >
                  {item.kind === "project" ? (
                    <ProjectThumbnail
                      projectId={item.id}
                      title={item.title}
                      variant="chip"
                    />
                  ) : (
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-zinc-500">
                      {item.kind === "developer" ? "開発" : "タグ"}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-zinc-100">
                      {item.title}
                    </span>
                    {item.subtitle ? (
                      <span className="block truncate text-xs text-zinc-500">
                        {item.subtitle}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-[10px] text-zinc-500">
                    {item.kind === "project"
                      ? item.category
                        ? PROJECT_CATEGORY_LABELS[item.category as ProjectCategoryId]
                        : "作品"
                      : item.kind === "developer"
                        ? "開発者"
                        : "タグ"}
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
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-xl border border-zinc-800/80 bg-zinc-900/40"
            />
          ))}
        </div>
      }
    >
      <GlobalSearchContent />
    </Suspense>
  );
}
