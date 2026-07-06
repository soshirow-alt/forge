"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  DiscoveryGameThumbnail,
} from "@/components/discovery-game-thumbnail";
import {
  filterSearchWorks,
  gameToSearchResult,
  mergeSearchResults,
  sortSearchWorks,
} from "@/lib/discovery-public-games";
import { useGames } from "@/components/games-provider";
import { DiscoveryHomeSkeleton } from "@/components/forge-loading-skeletons";
import { useForgePerfRoute } from "@/hooks/use-forge-perf-route";
import {
  paginateSearchResults,
  searchFeatureTagFilters,
  searchGenreFilters,
  searchWorkResults,
  type SearchSortId,
} from "@/lib/search-v0-mock-data";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import { useHideV0MockContent } from "@/lib/forge-deployment-context";
import { DiscoveryCardStatPills } from "@/components/discovery-card-stat-pills";
import {
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  List,
} from "lucide-react";

const PAGE_SIZE = 5;

type SearchViewMode = "list" | "grid";

const SORT_OPTIONS: { id: SearchSortId; label: string }[] = [
  { id: "recommended", label: "おすすめ順" },
  { id: "watch", label: "フォローが多い順" },
  { id: "feedback", label: "フィードバックが多い順" },
];

function parseView(param: string | null): SearchViewMode {
  return param === "grid" ? "grid" : "list";
}

function parseSort(param: string | null): SearchSortId {
  if (param === "watch" || param === "witness") {
    return "watch";
  }
  if (param === "feedback" || param === "voices") {
    return "feedback";
  }
  return "recommended";
}

function parseGenres(param: string | null): string[] {
  if (!param?.trim()) {
    return [];
  }
  return param
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => value !== "すべてのジャンル");
}

function parseFeatures(param: string | null): string[] {
  if (!param?.trim()) {
    return [];
  }
  return param
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function WorksSearchContent() {
  const hideV0Mock = useHideV0MockContent();
  const { publicGames, publicCatalogReady, getPublicProjectStats } = useGames();

  useForgePerfRoute({
    route: "/search",
    ready: publicCatalogReady,
    context: { gameCount: publicGames.length },
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryFromUrl = searchParams.get("q")?.trim() ?? "";
  const genresFromUrl = parseGenres(searchParams.get("genre"));
  const featuresFromUrl = parseFeatures(searchParams.get("tag"));
  const sortFromUrl = parseSort(searchParams.get("sort"));
  const viewFromUrl = parseView(searchParams.get("view"));
  const pageFromUrl = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const [keyword, setKeyword] = useState(queryFromUrl);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(genresFromUrl);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(featuresFromUrl);

  const genreParam = searchParams.get("genre");
  const featureParam = searchParams.get("tag");

  useEffect(() => {
    setKeyword(queryFromUrl);
    setSelectedGenres(parseGenres(genreParam));
    setSelectedFeatures(parseFeatures(featureParam));
  }, [queryFromUrl, genreParam, featureParam]);

  const cardStatsFor = useMemo(
    () => (gameId: string) => {
      const stats = getPublicProjectStats(gameId);
      return {
        feedbackParticipantCount: stats.feedbackParticipantCount,
        watchCount: stats.watchCount,
      };
    },
    [getPublicProjectStats],
  );

  const catalog = useMemo(() => {
    const realWorks = publicGames.map((game) =>
      gameToSearchResult(game, cardStatsFor(game.id)),
    );
    return mergeSearchResults(realWorks, searchWorkResults, hideV0Mock);
  }, [publicGames, cardStatsFor, hideV0Mock]);

  const filtered = useMemo(
    () => filterSearchWorks(catalog, queryFromUrl, genresFromUrl, featuresFromUrl),
    [catalog, queryFromUrl, genresFromUrl, featuresFromUrl],
  );
  const sorted = useMemo(
    () => sortSearchWorks(filtered, sortFromUrl),
    [filtered, sortFromUrl],
  );
  const pagination = useMemo(
    () => paginateSearchResults(sorted, pageFromUrl, PAGE_SIZE),
    [sorted, pageFromUrl],
  );
  const emptyResultsMessage =
    catalog.length === 0
      ? "まだ公開中の作品がありません"
      : "条件に合う作品がありません。絞り込みを変更してください。";

  const buildSearchUrl = useCallback(
    (overrides: { page?: number; sort?: SearchSortId; view?: SearchViewMode }) => {
      const params = new URLSearchParams();
      if (queryFromUrl) {
        params.set("q", queryFromUrl);
      }
      if (genresFromUrl.length > 0) {
        params.set("genre", genresFromUrl.join(","));
      }
      if (featuresFromUrl.length > 0) {
        params.set("tag", featuresFromUrl.join(","));
      }
      const sort = overrides.sort ?? sortFromUrl;
      if (sort !== "recommended") {
        params.set("sort", sort);
      }
      const view = overrides.view ?? viewFromUrl;
      if (view === "grid") {
        params.set("view", "grid");
      }
      const page = overrides.page ?? pageFromUrl;
      if (page > 1) {
        params.set("page", String(page));
      }
      const qs = params.toString();
      return qs ? `/search?${qs}` : "/search";
    },
    [featuresFromUrl, genresFromUrl, pageFromUrl, queryFromUrl, sortFromUrl, viewFromUrl],
  );

  const applySearch = useCallback(() => {
    const params = new URLSearchParams();
    if (keyword.trim()) {
      params.set("q", keyword.trim());
    }
    if (selectedGenres.length > 0) {
      params.set("genre", selectedGenres.join(","));
    }
    if (selectedFeatures.length > 0) {
      params.set("tag", selectedFeatures.join(","));
    }
    if (sortFromUrl !== "recommended") {
      params.set("sort", sortFromUrl);
    }
    if (viewFromUrl === "grid") {
      params.set("view", "grid");
    }
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
  }, [keyword, router, selectedFeatures, selectedGenres, sortFromUrl, viewFromUrl]);

  const pushSearch = useCallback(
    (next: { q?: string; genres?: string[]; features?: string[] }) => {
      const params = new URLSearchParams();
      const q = (next.q ?? queryFromUrl).trim();
      if (q) {
        params.set("q", q);
      }
      const genres = next.genres ?? genresFromUrl;
      if (genres.length > 0) {
        params.set("genre", genres.join(","));
      }
      const features = next.features ?? featuresFromUrl;
      if (features.length > 0) {
        params.set("tag", features.join(","));
      }
      if (sortFromUrl !== "recommended") {
        params.set("sort", sortFromUrl);
      }
      if (viewFromUrl === "grid") {
        params.set("view", "grid");
      }
      const qs = params.toString();
      router.push(qs ? `/search?${qs}` : "/search");
    },
    [featuresFromUrl, genresFromUrl, queryFromUrl, router, sortFromUrl, viewFromUrl],
  );

  const clearFilters = useCallback(() => {
    setKeyword("");
    setSelectedGenres([]);
    setSelectedFeatures([]);
    router.push("/search");
  }, [router]);

  const toggleGenre = (genre: string) => {
    const nextGenres =
      genre === "すべてのジャンル"
        ? []
        : selectedGenres.includes(genre)
          ? selectedGenres.filter((value) => value !== genre)
          : [...selectedGenres, genre];
    setSelectedGenres(nextGenres);
    pushSearch({ genres: nextGenres });
  };

  const toggleFeature = (feature: string) => {
    const nextFeatures = selectedFeatures.includes(feature)
      ? selectedFeatures.filter((value) => value !== feature)
      : [...selectedFeatures, feature];
    setSelectedFeatures(nextFeatures);
    pushSearch({ features: nextFeatures });
  };

  if (!publicCatalogReady) {
    return <DiscoveryHomeSkeleton />;
  }

  return (
    <div className="flex flex-col gap-8 xl:flex-row">
        <div className="min-w-0 flex-1">
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {queryFromUrl ? `「${queryFromUrl}」の検索結果` : "作品を探す"}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              {filtered.length}件の作品が見つかりました
              {genresFromUrl.length > 0 && (
                <span className="text-zinc-500">
                  {" "}
                  （ジャンル: {genresFromUrl.join("・")}）
                </span>
              )}
              {featuresFromUrl.length > 0 && (
                <span className="text-zinc-500">
                  {" "}
                  （特徴: {featuresFromUrl.join("・")}）
                </span>
              )}
            </p>
          </header>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => (
                <Link
                  key={option.id}
                  href={buildSearchUrl({ sort: option.id, page: 1 })}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    sortFromUrl === option.id
                      ? "border-violet-500/40 bg-violet-500/10 text-violet-200"
                      : "border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
            <div className="flex rounded-lg border border-zinc-800 p-0.5">
              <Link
                href={buildSearchUrl({ view: "list", page: 1 })}
                className={`rounded-md p-2 transition-colors ${
                  viewFromUrl === "list"
                    ? "bg-violet-600 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
                aria-label="リスト表示"
                aria-current={viewFromUrl === "list" ? "true" : undefined}
              >
                <List className="size-4" />
              </Link>
              <Link
                href={buildSearchUrl({ view: "grid", page: 1 })}
                className={`rounded-md p-2 transition-colors ${
                  viewFromUrl === "grid"
                    ? "bg-violet-600 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
                aria-label="グリッド表示"
                aria-current={viewFromUrl === "grid" ? "true" : undefined}
              >
                <LayoutGrid className="size-4" />
              </Link>
            </div>
          </div>

          {viewFromUrl === "list" ? (
          <ul className="mt-6 space-y-4">
            {pagination.items.map((work) => (
              <li key={work.id}>
                <Link
                  href={gameDetailHref(work.id)}
                  className="block rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700/80 sm:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <DiscoveryGameThumbnail
                      id={work.id}
                      title={work.title}
                      genre={work.tags[0]}
                      image={work.image}
                      className="h-28 w-full shrink-0 sm:h-32 sm:w-48"
                      sizes="192px"
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold text-white">{work.title}</h2>
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-400">
                        {work.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {work.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md border border-zinc-700/80 bg-zinc-800/60 px-2.5 py-1 text-xs text-zinc-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 border-t border-zinc-800/80 pt-4 text-sm lg:w-44 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                      <p className="flex items-center gap-1.5 text-zinc-300">
                        {work.developer}
                        {work.verified && (
                          <BadgeCheck
                            className="size-4 text-violet-400"
                            aria-label="認証済み開発者"
                          />
                        )}
                      </p>
                      <p className="text-xs text-zinc-500">更新: {work.updatedAgo}</p>
                      <div className="mt-2">
                        <DiscoveryCardStatPills
                          feedbackCount={work.feedbackCount}
                          watchCount={work.watchCount}
                          compact
                        />
                      </div>
                      <p className="text-xs text-zinc-600">{work.platforms.join(" · ")}</p>
                    </div>
                    <span
                      className="hidden self-center rounded-lg p-2 text-zinc-500 lg:inline-flex"
                      aria-hidden="true"
                    >
                      <ChevronRight className="size-5" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
            {pagination.items.length === 0 && (
              <li className="rounded-2xl border border-dashed border-zinc-800 px-6 py-16 text-center text-sm text-zinc-500">
                {emptyResultsMessage}
              </li>
            )}
          </ul>
          ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pagination.items.map((work) => (
              <li key={work.id}>
                <Link
                  href={gameDetailHref(work.id)}
                  className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 transition-colors hover:border-zinc-700/80"
                >
                  <DiscoveryGameThumbnail
                    id={work.id}
                    title={work.title}
                    genre={work.tags[0]}
                    image={work.image}
                    className="h-36 w-full rounded-none"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="font-semibold text-white">{work.title}</h2>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                      {work.description}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">{work.updatedAgo}</p>
                    <div className="mt-auto pt-3">
                      <DiscoveryCardStatPills
                        feedbackCount={work.feedbackCount}
                        watchCount={work.watchCount}
                        compact
                      />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
            {pagination.items.length === 0 && (
              <li className="col-span-full rounded-2xl border border-dashed border-zinc-800 px-6 py-16 text-center text-sm text-zinc-500">
                条件に合う作品がありません。絞り込みを変更してください。
              </li>
            )}
          </ul>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500">
            <p>
              {pagination.totalItems}件中 {(pagination.page - 1) * PAGE_SIZE + 1}–
              {Math.min(pagination.page * PAGE_SIZE, pagination.totalItems)}件
            </p>
            <div className="flex items-center gap-1">
              {pagination.page > 1 ? (
                <Link
                  href={buildSearchUrl({ page: pagination.page - 1 })}
                  className="rounded-lg border border-zinc-800 px-3 py-1.5 transition-colors hover:border-zinc-700 hover:text-zinc-300"
                >
                  前へ
                </Link>
              ) : (
                <span className="rounded-lg border border-zinc-800 px-3 py-1.5 text-zinc-600">
                  前へ
                </span>
              )}
              {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((page) => (
                <Link
                  key={page}
                  href={buildSearchUrl({ page })}
                  className={`rounded-lg border px-3 py-1.5 ${
                    page === pagination.page
                      ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                      : "border-zinc-800 transition-colors hover:border-zinc-700 hover:text-zinc-300"
                  }`}
                >
                  {page}
                </Link>
              ))}
              {pagination.page < pagination.totalPages ? (
                <Link
                  href={buildSearchUrl({ page: pagination.page + 1 })}
                  className="rounded-lg border border-zinc-800 px-3 py-1.5 transition-colors hover:border-zinc-700 hover:text-zinc-300"
                >
                  次へ
                </Link>
              ) : (
                <span className="rounded-lg border border-zinc-800 px-3 py-1.5 text-zinc-600">
                  次へ
                </span>
              )}
            </div>
          </div>
        </div>

        <aside className="w-full shrink-0 xl:w-72">
          <section className="sticky top-24 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">絞り込み</h2>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-violet-400 transition-colors hover:text-violet-300"
              >
                すべてクリア
              </button>
            </div>

            <div className="mt-4">
              <label htmlFor="filter-keyword" className="text-xs font-medium text-zinc-500">
                キーワード
              </label>
              <input
                id="filter-keyword"
                type="text"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applySearch();
                  }
                }}
                className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
              />
            </div>

            <fieldset className="mt-5">
              <legend className="text-xs font-medium text-zinc-500">ジャンル</legend>
              <div className="mt-2 max-h-40 space-y-2 overflow-y-auto pr-1">
                {searchGenreFilters.map((genre) => (
                  <label
                    key={genre}
                    className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400"
                  >
                    <input
                      type="checkbox"
                      checked={
                        genre === "すべてのジャンル"
                          ? selectedGenres.length === 0
                          : selectedGenres.includes(genre)
                      }
                      onChange={() => toggleGenre(genre)}
                      className="size-4 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/40"
                    />
                    {genre}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-5">
              <legend className="text-xs font-medium text-zinc-500">特徴タグ</legend>
              <div className="mt-2 max-h-40 space-y-2 overflow-y-auto pr-1">
                {searchFeatureTagFilters.map((feature) => (
                  <label
                    key={feature}
                    className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(feature)}
                      onChange={() => toggleFeature(feature)}
                      className="size-4 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/40"
                    />
                    {feature}
                  </label>
                ))}
              </div>
            </fieldset>

            <p className="mt-4 text-xs leading-relaxed text-zinc-600">
              作品名・ジャンル・特徴タグで絞り込めます。
            </p>
            <button
              type="button"
              onClick={applySearch}
              className="mt-6 flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-opacity hover:opacity-90"
            >
              この条件で検索
              <ChevronDown className="size-4 rotate-[-90deg]" aria-hidden="true" />
            </button>
          </section>
        </aside>
    </div>
  );
}

export function WorksSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-[#0a0a0a] text-zinc-500">
          読み込み中...
        </div>
      }
    >
      <WorksSearchContent />
    </Suspense>
  );
}
