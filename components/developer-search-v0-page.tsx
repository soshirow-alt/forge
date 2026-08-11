"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useGames } from "@/components/games-provider";
import { DeveloperGachaModal } from "@/components/developer-gacha-modal";
import { DeveloperListCard } from "@/components/developer-list-card";
import { PlayerShell } from "@/components/player-shell";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { CREATOR_ACTIVITY_CATEGORY_FILTERS } from "@/lib/creator-activity-categories";
import { buildPublicDeveloperSearchResults } from "@/lib/discovery-public-developers";
import {
  DEVELOPER_SEARCH_TOTAL,
  developerSearchResults,
  developerSearchSortOptions,
  filterDevelopers,
  parseDeveloperSort,
  parseDeveloperSortOrder,
  sortDevelopers,
  type DeveloperSearchResult,
  type DeveloperSearchSortId,
  type DeveloperSearchSortOrder,
} from "@/lib/developer-search-v0-mock-data";
import { shouldHideV0MockContent } from "@/lib/production-mode";
import {
  isProjectCategoryId,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import { countDeveloperFollowersBatchInDb } from "@/lib/supabase/developer-follows-db";
import { isGamePublic } from "@/lib/project-visibility";
import { Dices } from "lucide-react";

function parseCsvParam(param: string | null): string[] {
  if (!param?.trim()) {
    return [];
  }
  return param
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

/** Legacy genre chips from `?genre=` (back-compat only). */
function parseGenres(param: string | null): string[] {
  return parseCsvParam(param);
}

function parseActivityCategories(param: string | null): ProjectCategoryId[] {
  return parseCsvParam(param).filter(isProjectCategoryId);
}

function buildCreatorsSearchUrl(options: {
  query?: string;
  sort?: DeveloperSearchSortId;
  order?: DeveloperSearchSortOrder;
  newOnly?: boolean;
  categories?: ProjectCategoryId[];
}): string {
  const params = new URLSearchParams();
  const query = options.query?.trim() ?? "";
  const sort = options.sort ?? "newest";
  const order = options.order ?? "desc";
  const newOnly = options.newOnly ?? false;
  const categories = options.categories ?? [];

  if (query) {
    params.set("q", query);
  }
  if (sort !== "newest") {
    params.set("sort", sort);
  }
  if (sort !== "newest" && order === "asc") {
    params.set("order", "asc");
  }
  if (newOnly) {
    params.set("new", "1");
  }
  if (categories.length > 0) {
    params.set("category", categories.join(","));
  }

  const qs = params.toString();
  return qs ? `/search/creators?${qs}` : "/search/creators";
}

function DeveloperSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hideV0Mock = shouldHideV0MockContent();
  const {
    publicGames,
    publicCatalogReady,
    dataReady,
    getDeveloperProfileByUserId,
    isFollowing,
    toggleFollowCreator,
    refreshPublicCatalog,
  } = useGames();
  const { requireAuth } = useRequireAuth();
  const queryFromUrl = searchParams.get("q")?.trim() ?? "";
  const sortFromUrl = parseDeveloperSort(searchParams.get("sort"));
  const orderFromUrl = parseDeveloperSortOrder(searchParams.get("order"));
  const newOnlyFromUrl = searchParams.get("new") === "1";
  const categoryParam = searchParams.get("category");
  const genreParam = searchParams.get("genre");
  const categoriesFromUrl = parseActivityCategories(categoryParam);
  const genresFromUrl = parseGenres(genreParam);

  const [query, setQuery] = useState(queryFromUrl);
  const [selectedCategories, setSelectedCategories] =
    useState<ProjectCategoryId[]>(categoriesFromUrl);
  const [newOnly, setNewOnly] = useState(newOnlyFromUrl);
  const [gachaOpen, setGachaOpen] = useState(false);
  const [gachaPick, setGachaPick] = useState<DeveloperSearchResult | null>(null);
  const [followerCounts, setFollowerCounts] = useState<Record<string, number>>({});
  const [followersLoaded, setFollowersLoaded] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const dev of developerSearchResults) {
      if (dev.following) {
        initial.add(dev.id);
      }
    }
    return initial;
  });

  useEffect(() => {
    if (hideV0Mock) {
      void refreshPublicCatalog();
    }
  }, [hideV0Mock, refreshPublicCatalog]);

  const publicOwnerIds = useMemo(() => {
    if (!hideV0Mock) {
      return [];
    }
    return [
      ...new Set(
        publicGames
          .filter(isGamePublic)
          .map((game) => game.ownerId)
          .filter((ownerId): ownerId is string => Boolean(ownerId)),
      ),
    ];
  }, [hideV0Mock, publicGames]);

  const publicDeveloperProfiles = useMemo(() => {
    return publicOwnerIds
      .map((ownerId) => getDeveloperProfileByUserId(ownerId))
      .filter((profile): profile is NonNullable<typeof profile> => Boolean(profile));
  }, [getDeveloperProfileByUserId, publicOwnerIds]);

  useEffect(() => {
    if (!hideV0Mock || !publicCatalogReady || publicOwnerIds.length === 0) {
      return;
    }

    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      setFollowersLoaded(true);
      return;
    }

    setFollowersLoaded(false);
    void countDeveloperFollowersBatchInDb(supabase, publicOwnerIds)
      .then((counts) => {
        setFollowerCounts(counts);
        setFollowersLoaded(true);
      })
      .catch(() => {
        setFollowerCounts({});
        setFollowersLoaded(true);
      });
  }, [hideV0Mock, publicCatalogReady, publicOwnerIds]);

  const catalog = useMemo(() => {
    if (!hideV0Mock) {
      return developerSearchResults;
    }
    return buildPublicDeveloperSearchResults(
      publicDeveloperProfiles,
      publicGames,
      followerCounts,
      isFollowing,
      { followersLoaded },
    );
  }, [
    followerCounts,
    followersLoaded,
    hideV0Mock,
    isFollowing,
    publicDeveloperProfiles,
    publicGames,
  ]);

  useEffect(() => {
    setQuery(queryFromUrl);
    setSelectedCategories(parseActivityCategories(categoryParam));
    setNewOnly(newOnlyFromUrl);
  }, [categoryParam, newOnlyFromUrl, queryFromUrl]);

  const handleFollow = useCallback(
    (devId: string) => {
      requireAuth(
        () => {
          if (hideV0Mock) {
            void toggleFollowCreator(devId);
            return;
          }
          setFollowingIds((prev) => {
            const next = new Set(prev);
            if (next.has(devId)) {
              next.delete(devId);
            } else {
              next.add(devId);
            }
            return next;
          });
        },
        buildCreatorsSearchUrl({
          query: queryFromUrl,
          sort: sortFromUrl,
          order: orderFromUrl,
          newOnly: newOnlyFromUrl,
          categories: categoriesFromUrl,
        }),
        { variant: "follow" },
      );
    },
    [
      categoriesFromUrl,
      hideV0Mock,
      newOnlyFromUrl,
      orderFromUrl,
      queryFromUrl,
      requireAuth,
      sortFromUrl,
      toggleFollowCreator,
    ],
  );

  const results = useMemo(() => {
    const filtered = filterDevelopers(
      queryFromUrl,
      categoriesFromUrl.length > 0 ? [] : genresFromUrl,
      catalog,
      categoriesFromUrl,
    );
    const scoped = newOnlyFromUrl ? filtered.filter((dev) => dev.isNew) : filtered;
    return sortDevelopers(scoped, sortFromUrl, orderFromUrl);
  }, [
    catalog,
    categoriesFromUrl,
    genresFromUrl,
    newOnlyFromUrl,
    orderFromUrl,
    queryFromUrl,
    sortFromUrl,
  ]);

  const totalLabel = hideV0Mock ? String(catalog.length) : String(DEVELOPER_SEARCH_TOTAL);

  if (hideV0Mock && (!dataReady || !publicCatalogReady)) {
    return (
      <PlayerShell activeNav="creator-search" headerSearchDefault={queryFromUrl}>
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </PlayerShell>
    );
  }

  const applySearch = () => {
    router.push(
      buildCreatorsSearchUrl({
        query,
        sort: sortFromUrl,
        order: orderFromUrl,
        newOnly: newOnlyFromUrl,
        categories: selectedCategories,
      }),
    );
  };

  const toggleNewOnly = (checked: boolean) => {
    setNewOnly(checked);
    router.push(
      buildCreatorsSearchUrl({
        query: queryFromUrl,
        sort: sortFromUrl,
        order: orderFromUrl,
        newOnly: checked,
        categories: categoriesFromUrl,
      }),
    );
  };

  const toggleCategory = (category: ProjectCategoryId) => {
    const nextCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((value) => value !== category)
      : [...selectedCategories, category];
    setSelectedCategories(nextCategories);
    router.push(
      buildCreatorsSearchUrl({
        query: queryFromUrl,
        sort: sortFromUrl,
        order: orderFromUrl,
        newOnly: newOnlyFromUrl,
        categories: nextCategories,
      }),
    );
  };

  const clearCategoryFilters = () => {
    setSelectedCategories([]);
    router.push(
      buildCreatorsSearchUrl({
        query: queryFromUrl,
        sort: sortFromUrl,
        order: orderFromUrl,
        newOnly: newOnlyFromUrl,
        categories: [],
      }),
    );
  };

  const toggleSortOrder = () => {
    const nextOrder: DeveloperSearchSortOrder = orderFromUrl === "desc" ? "asc" : "desc";
    router.push(
      buildCreatorsSearchUrl({
        query: queryFromUrl,
        sort: sortFromUrl,
        order: nextOrder,
        newOnly: newOnlyFromUrl,
        categories: categoriesFromUrl,
      }),
    );
  };

  const runGacha = () => {
    if (results.length === 0) {
      return;
    }
    const pick = results[Math.floor(Math.random() * results.length)];
    setGachaPick(pick);
    setGachaOpen(true);
  };

  const sortOrderLabel =
    sortFromUrl === "followers"
      ? orderFromUrl === "desc"
        ? "フォロワーが多い順"
        : "フォロワーが少ない順"
      : sortFromUrl === "works"
        ? orderFromUrl === "desc"
          ? "作品数が多い順"
          : "作品数が少ない順"
        : null;

  return (
    <PlayerShell activeNav="creator-search" headerSearchDefault={queryFromUrl}>
      <DeveloperGachaModal
        open={gachaOpen}
        developer={gachaPick}
        onClose={() => setGachaOpen(false)}
      />

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1 grow">
          <header>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">クリエイターを探す</h1>
            <p className="mt-2 text-sm text-zinc-400">クリエイター名で検索できます</p>
          </header>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              placeholder="クリエイター名を入力して検索"
              className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
            />
            <button
              type="button"
              onClick={applySearch}
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
            >
              検索
            </button>
            <button
              type="button"
              onClick={runGacha}
              disabled={results.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/10 px-5 py-2.5 text-sm font-semibold text-fuchsia-200 transition-colors hover:bg-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Dices className="size-4" aria-hidden="true" />
              ガチャ
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-500">
              検索結果: {totalLabel}人（表示 {results.length}人）
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {developerSearchSortOptions.map((option) => (
                <Link
                  key={option.id}
                  href={buildCreatorsSearchUrl({
                    query: queryFromUrl,
                    sort: option.id,
                    order: orderFromUrl,
                    newOnly: newOnlyFromUrl,
                    categories: categoriesFromUrl,
                  })}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    sortFromUrl === option.id
                      ? "border-violet-500/40 bg-violet-500/10 text-violet-200"
                      : "border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  {option.label}
                </Link>
              ))}
              {sortFromUrl !== "newest" && (
                <button
                  type="button"
                  onClick={toggleSortOrder}
                  className="rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-violet-500/40 hover:text-violet-200"
                  aria-label={`並び順を切り替え（現在: ${sortOrderLabel}）`}
                >
                  {orderFromUrl === "desc" ? "↓ 多い順" : "↑ 少ない順"}
                </button>
              )}
            </div>
          </div>

          <ul className="mt-6 space-y-4">
            {results.map((dev) => (
              <li key={dev.id}>
                <DeveloperListCard
                  dev={dev}
                  following={hideV0Mock ? isFollowing(dev.id) : followingIds.has(dev.id)}
                  onFollow={handleFollow}
                />
              </li>
            ))}
            {results.length === 0 && (
              <li className="rounded-2xl border border-dashed border-zinc-800 px-6 py-16 text-center text-sm text-zinc-500">
                条件に合うクリエイターがいません。絞り込みを変更してください。
              </li>
            )}
          </ul>
        </div>

        <aside className="w-full shrink-0 xl:w-72">
          <section className="sticky top-24 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">絞り込み</h2>
              {selectedCategories.length > 0 && (
                <button
                  type="button"
                  onClick={clearCategoryFilters}
                  className="text-xs text-violet-400 transition-colors hover:text-violet-300"
                >
                  カテゴリをクリア
                </button>
              )}
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
              <input
                type="checkbox"
                checked={newOnlyFromUrl}
                onChange={(e) => toggleNewOnly(e.target.checked)}
                className="size-4 rounded border-zinc-600 bg-zinc-900 text-violet-500"
              />
              🌱 新規クリエイターのみ
            </label>

            <fieldset className="mt-5">
              <legend className="text-xs font-medium text-zinc-500">活動カテゴリ</legend>
              <div className="mt-2 max-h-48 space-y-2 overflow-y-auto pr-1">
                {CREATOR_ACTIVITY_CATEGORY_FILTERS.map((category) => (
                  <label
                    key={category.id}
                    className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                      className="size-4 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/40"
                    />
                    {category.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <p className="mt-4 text-xs leading-relaxed text-zinc-600">
              クリエイター名で検索し、活動カテゴリで絞り込めます。
            </p>
          </section>
        </aside>
      </div>
    </PlayerShell>
  );
}

export function DeveloperSearchV0Page() {
  return (
    <Suspense fallback={<div className="flex min-h-full items-center justify-center bg-[#0a0a0a] text-zinc-500">読み込み中...</div>}>
      <DeveloperSearchContent />
    </Suspense>
  );
}
