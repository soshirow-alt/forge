"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useGames } from "@/components/games-provider";
import { DeveloperGachaModal } from "@/components/developer-gacha-modal";
import { DeveloperListCard } from "@/components/developer-list-card";
import { PlayerShell } from "@/components/player-shell";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { buildPublicDeveloperSearchResults } from "@/lib/discovery-public-developers";
import {
  DEVELOPER_SEARCH_TOTAL,
  developerGenreFilters,
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
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import { countDeveloperFollowersBatchInDb } from "@/lib/supabase/developer-follows-db";
import { isGamePublic } from "@/lib/project-visibility";
import { Dices } from "lucide-react";

function parseGenres(param: string | null): string[] {
  if (!param?.trim()) {
    return [];
  }
  return param
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function buildCreatorsSearchUrl(options: {
  query?: string;
  sort?: DeveloperSearchSortId;
  order?: DeveloperSearchSortOrder;
  newOnly?: boolean;
  genres?: string[];
}): string {
  const params = new URLSearchParams();
  const query = options.query?.trim() ?? "";
  const sort = options.sort ?? "recommended";
  const order = options.order ?? "desc";
  const newOnly = options.newOnly ?? false;
  const genres = options.genres ?? [];

  if (query) {
    params.set("q", query);
  }
  if (sort !== "recommended") {
    params.set("sort", sort);
  }
  if (sort !== "recommended" && order === "asc") {
    params.set("order", "asc");
  }
  if (newOnly) {
    params.set("new", "1");
  }
  if (genres.length > 0) {
    params.set("genre", genres.join(","));
  }

  const qs = params.toString();
  return qs ? `/search/creators?${qs}` : "/search/creators";
}

function DeveloperSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hideV0Mock = shouldHideV0MockContent();
  const {
    submittedGames,
    dataReady,
    getDeveloperProfileByUserId,
    isFollowing,
    toggleFollowCreator,
  } = useGames();
  const { requireAuth } = useRequireAuth();
  const queryFromUrl = searchParams.get("q")?.trim() ?? "";
  const sortFromUrl = parseDeveloperSort(searchParams.get("sort"));
  const orderFromUrl = parseDeveloperSortOrder(searchParams.get("order"));
  const newOnlyFromUrl = searchParams.get("new") === "1";
  const genresFromUrl = parseGenres(searchParams.get("genre"));
  const genreParam = searchParams.get("genre");

  const [query, setQuery] = useState(queryFromUrl);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(genresFromUrl);
  const [newOnly, setNewOnly] = useState(newOnlyFromUrl);
  const [gachaOpen, setGachaOpen] = useState(false);
  const [gachaPick, setGachaPick] = useState<DeveloperSearchResult | null>(null);
  const [followerCounts, setFollowerCounts] = useState<Record<string, number>>({});
  const [followingIds, setFollowingIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const dev of developerSearchResults) {
      if (dev.following) {
        initial.add(dev.id);
      }
    }
    return initial;
  });

  const publicOwnerIds = useMemo(() => {
    if (!hideV0Mock) {
      return [];
    }
    return [
      ...new Set(
        submittedGames
          .filter(isGamePublic)
          .map((game) => game.ownerId)
          .filter((ownerId): ownerId is string => Boolean(ownerId)),
      ),
    ];
  }, [hideV0Mock, submittedGames]);

  const publicDeveloperProfiles = useMemo(() => {
    return publicOwnerIds
      .map((ownerId) => getDeveloperProfileByUserId(ownerId))
      .filter((profile): profile is NonNullable<typeof profile> => Boolean(profile));
  }, [getDeveloperProfileByUserId, publicOwnerIds]);

  useEffect(() => {
    if (!hideV0Mock || !dataReady || publicOwnerIds.length === 0) {
      return;
    }

    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      return;
    }

    void countDeveloperFollowersBatchInDb(supabase, publicOwnerIds)
      .then(setFollowerCounts)
      .catch(() => setFollowerCounts({}));
  }, [dataReady, hideV0Mock, publicOwnerIds]);

  const catalog = useMemo(() => {
    if (!hideV0Mock) {
      return developerSearchResults;
    }
    return buildPublicDeveloperSearchResults(
      publicDeveloperProfiles,
      submittedGames,
      followerCounts,
      isFollowing,
    );
  }, [
    followerCounts,
    hideV0Mock,
    isFollowing,
    publicDeveloperProfiles,
    submittedGames,
  ]);

  useEffect(() => {
    setQuery(queryFromUrl);
    setSelectedGenres(parseGenres(genreParam));
    setNewOnly(newOnlyFromUrl);
  }, [genreParam, newOnlyFromUrl, queryFromUrl]);

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
          genres: genresFromUrl,
        }),
        { variant: "follow" },
      );
    },
    [
      genresFromUrl,
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
    const filtered = filterDevelopers(queryFromUrl, genresFromUrl, catalog);
    const scoped = newOnlyFromUrl ? filtered.filter((dev) => dev.isNew) : filtered;
    return sortDevelopers(scoped, sortFromUrl, orderFromUrl);
  }, [catalog, genresFromUrl, newOnlyFromUrl, orderFromUrl, queryFromUrl, sortFromUrl]);

  const totalLabel = hideV0Mock ? String(catalog.length) : String(DEVELOPER_SEARCH_TOTAL);

  if (hideV0Mock && !dataReady) {
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
        genres: selectedGenres,
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
        genres: genresFromUrl,
      }),
    );
  };

  const toggleGenre = (genre: string) => {
    const nextGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter((value) => value !== genre)
      : [...selectedGenres, genre];
    setSelectedGenres(nextGenres);
    router.push(
      buildCreatorsSearchUrl({
        query: queryFromUrl,
        sort: sortFromUrl,
        order: orderFromUrl,
        newOnly: newOnlyFromUrl,
        genres: nextGenres,
      }),
    );
  };

  const clearGenreFilters = () => {
    setSelectedGenres([]);
    router.push(
      buildCreatorsSearchUrl({
        query: queryFromUrl,
        sort: sortFromUrl,
        order: orderFromUrl,
        newOnly: newOnlyFromUrl,
        genres: [],
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
        genres: genresFromUrl,
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

      <div className="flex flex-col gap-8 xl:flex-row">
        <div className="min-w-0 flex-1">
          <header>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">開発者を探す</h1>
            <p className="mt-2 text-sm text-zinc-400">開発者名で検索できます</p>
          </header>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              placeholder="開発者名を入力して検索"
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
                    genres: genresFromUrl,
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
              {sortFromUrl !== "recommended" && (
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
                条件に合う開発者がいません。絞り込みを変更してください。
              </li>
            )}
          </ul>
        </div>

        <aside className="w-full shrink-0 xl:w-72">
          <section className="sticky top-24 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">絞り込み</h2>
              {selectedGenres.length > 0 && (
                <button
                  type="button"
                  onClick={clearGenreFilters}
                  className="text-xs text-violet-400 transition-colors hover:text-violet-300"
                >
                  ジャンルをクリア
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
              🌱 新規開発者のみ
            </label>

            <fieldset className="mt-5">
              <legend className="text-xs font-medium text-zinc-500">ジャンル</legend>
              <div className="mt-2 max-h-48 space-y-2 overflow-y-auto pr-1">
                {developerGenreFilters.map((genre) => (
                  <label
                    key={genre}
                    className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400"
                  >
                    <input
                      type="checkbox"
                      checked={selectedGenres.includes(genre)}
                      onChange={() => toggleGenre(genre)}
                      className="size-4 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/40"
                    />
                    {genre}
                  </label>
                ))}
              </div>
            </fieldset>

            <p className="mt-4 text-xs leading-relaxed text-zinc-600">
              開発者名で検索し、登録ジャンルで絞り込めます。ガチャは表示中の開発者から1人をランダム表示します。
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
