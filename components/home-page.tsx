"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { BookmarkButton } from "@/components/bookmark-button";
import { ForgeHeader } from "@/components/forge-header";
import { CreatorLink } from "@/components/creator-link";
import { GameTags } from "@/components/game-tags";
import { GameThumbnail } from "@/components/game-thumbnail";
import { useGames } from "@/components/games-provider";
import {
  filterGames,
  getDefaultSortForTab,
  getGamesForDiscoveryTab,
  sortGames,
  type DiscoveryTab,
  type SortOption,
} from "@/lib/game-filters";
import { DiscoveryFilterChips } from "@/components/discovery-filter-chips";
import { GameActivityBadges } from "@/components/game-activity-badges";
import { PlayEnvironmentBadges } from "@/components/play-environment-badges";
import { TrustSafetyBadge } from "@/components/trust-safety-badge";
import { HeroGameShowcase } from "@/components/hero-game-showcase";
import {
  EMPTY_DISCOVERY_FILTERS,
  applyDiscoveryChipFilters,
  hasActiveChipFilters,
  type DiscoveryChipFilters,
} from "@/lib/discovery-filters";
import { pickFeaturedGames } from "@/lib/featured-games";
import { getPlayTypeLabel } from "@/lib/game-links";
import { games as mockGames, type Game } from "@/lib/mock-games";
import { LABEL_TEST_PLAY_OPEN } from "@/lib/user-labels";

const HERO_SHOWCASE_FALLBACK_IDS = [
  "emberfall",
  "neon-drift",
  "starbound-tactics",
  "hollow-signal",
  "wolfpack-siege",
] as const;

const discoveryTabs: { id: DiscoveryTab; label: string; subtitle: string }[] = [
  {
    id: "new",
    label: "新着作品",
    subtitle: "完成前の作品をいち早くチェック",
  },
  {
    id: "testers",
    label: "テストプレイ受付中",
    subtitle: "開発者が感想や不具合報告を求めている作品",
  },
  {
    id: "trending",
    label: "急上昇",
    subtitle: "いま応援が集まっている作品",
  },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "新着順" },
  { value: "support", label: "応援数順" },
  { value: "updated", label: "更新日順" },
  { value: "testers", label: "テストプレイ受付中" },
];

const inputClassName =
  "w-full rounded-xl border border-zinc-700/80 bg-zinc-900/80 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 backdrop-blur-sm focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50";

type BadgeVariant = "new" | "tester" | "play" | "update" | "phase" | "trending";

const badgeStyles: Record<BadgeVariant, string> = {
  new: "border-orange-500/35 bg-orange-500/10 text-orange-300",
  tester: "border-violet-500/35 bg-violet-500/10 text-violet-300",
  play: "border-sky-500/35 bg-sky-500/10 text-sky-300",
  update: "border-amber-500/35 bg-amber-500/10 text-amber-300",
  phase: "border-zinc-600/50 bg-zinc-950/70 text-zinc-300",
  trending: "border-rose-500/35 bg-rose-500/10 text-rose-300",
};

function DiscoveryBadge({
  children,
  variant,
}: {
  children: ReactNode;
  variant: BadgeVariant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide backdrop-blur-sm ${badgeStyles[variant]}`}
    >
      {children}
    </span>
  );
}

function DiscoveryGameCard({
  game,
  showNewBadge = false,
  showTrendingBadge = false,
}: {
  game: Game;
  showNewBadge?: boolean;
  showTrendingBadge?: boolean;
}) {
  const { hasDevlogs } = useGames();
  const playLabel = getPlayTypeLabel(game.playUrl);
  const hasUpdate = hasDevlogs(game.id);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-900/40 shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/10">
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/0 via-transparent to-violet-600/0 opacity-0 transition-opacity duration-300 group-hover:from-orange-500/[0.04] group-hover:to-violet-600/[0.06] group-hover:opacity-100" />

      <Link
        href={`/games/${game.id}`}
        className="relative block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      >
        <div className="relative">
          <GameThumbnail
            thumbnailUrl={game.thumbnailUrl}
            status={game.status}
            projectId={game.id}
            title={game.title}
            genre={game.genre}
            phase={game.phase}
            showStatus={false}
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {showNewBadge && <DiscoveryBadge variant="new">新着</DiscoveryBadge>}
            {showTrendingBadge && (
              <DiscoveryBadge variant="trending">急上昇</DiscoveryBadge>
            )}
            {game.lookingForTesters && (
              <DiscoveryBadge variant="tester">{LABEL_TEST_PLAY_OPEN}</DiscoveryBadge>
            )}
          </div>
          <div className="absolute bottom-3 left-3">
            <DiscoveryBadge variant="phase">{game.phase}</DiscoveryBadge>
          </div>
        </div>

        <div className="relative p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold leading-snug text-zinc-50 transition-colors group-hover:text-orange-300">
                {game.title}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">{game.genre}</p>
              {game.estimatedPlayTime && (
                <p className="mt-0.5 text-xs text-zinc-600">
                  想定 {game.estimatedPlayTime}
                </p>
              )}
            </div>
          </div>

          <div className="mt-2.5">
            <GameActivityBadges game={game} compact />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <DiscoveryBadge variant="play">{playLabel}</DiscoveryBadge>
            {hasUpdate && <DiscoveryBadge variant="update">更新あり</DiscoveryBadge>}
            <TrustSafetyBadge game={game} />
          </div>

          <GameTags tags={game.tags} />
          <PlayEnvironmentBadges game={game} compact />

          <p className="mt-4 text-sm font-medium text-zinc-500 transition-colors group-hover:text-orange-400/90">
            詳細を見る →
          </p>
        </div>
      </Link>

      <div className="relative flex items-center justify-between gap-3 border-t border-zinc-800/80 bg-zinc-950/30 px-5 py-3.5">
        <CreatorLink name={game.creator} />
        <BookmarkButton gameId={game.id} compact />
      </div>
    </article>
  );
}

function DiscoverySkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
      <div className="aspect-video animate-pulse bg-zinc-800/80" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-800/80" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-800/60" />
        <div className="flex gap-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-zinc-800/60" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-zinc-800/60" />
        </div>
      </div>
    </div>
  );
}

function GameSection({
  title,
  subtitle,
  games,
  showNewBadge = false,
  showTrendingBadge = false,
  loading = false,
  emptyMessage,
}: {
  title: string;
  subtitle: string;
  games: Game[];
  showNewBadge?: boolean;
  showTrendingBadge?: boolean;
  loading?: boolean;
  emptyMessage?: string;
}) {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-14 sm:py-16">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 h-1 w-12 rounded-full bg-gradient-to-r from-orange-500 to-violet-500" />
          <h2 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
            {title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-zinc-500">{subtitle}</p>
        </div>
        {games.length > 0 && (
          <p className="text-sm text-zinc-600">{games.length}件</p>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <DiscoverySkeletonCard key={index} />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-14 text-center">
          <p className="text-zinc-500">
            {emptyMessage ?? "現在表示できる作品がありません。"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <DiscoveryGameCard
              key={game.id}
              game={game}
              showNewBadge={showNewBadge}
              showTrendingBadge={showTrendingBadge}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function HomePage() {
  const {
    getGamesBySection,
    getSupportCount,
    isSubmittedGame,
    dataReady,
    hasDevlogs,
  } = useGames();
  const [searchQuery, setSearchQuery] = useState("");
  const [discoveryTab, setDiscoveryTab] = useState<DiscoveryTab>("new");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [chipFilters, setChipFilters] =
    useState<DiscoveryChipFilters>(EMPTY_DISCOVERY_FILTERS);

  const newGamesRaw = useMemo(
    () => getGamesBySection("new"),
    [getGamesBySection],
  );
  const testerGamesRaw = useMemo(
    () => getGamesBySection("testers"),
    [getGamesBySection],
  );
  const betaGamesRaw = useMemo(
    () => getGamesBySection("beta"),
    [getGamesBySection],
  );

  const allListableGames = useMemo(() => {
    const seen = new Set<string>();
    const combined: Game[] = [];
    for (const game of [...newGamesRaw, ...testerGamesRaw, ...betaGamesRaw]) {
      if (!seen.has(game.id)) {
        seen.add(game.id);
        combined.push(game);
      }
    }
    return combined;
  }, [newGamesRaw, testerGamesRaw, betaGamesRaw]);

  const heroShowcaseGames = useMemo(() => {
    const featured = pickFeaturedGames(
      allListableGames,
      getSupportCount,
      isSubmittedGame,
      hasDevlogs,
      5,
    ).map((item) => item.game);

    if (featured.length >= 3) {
      return featured;
    }

    const fallback = HERO_SHOWCASE_FALLBACK_IDS.map(
      (id) => mockGames.find((game) => game.id === id)!,
    ).filter(Boolean);

    const seen = new Set<string>();
    const combined: Game[] = [];
    for (const game of [...featured, ...fallback]) {
      if (!seen.has(game.id)) {
        seen.add(game.id);
        combined.push(game);
      }
    }
    return combined.slice(0, 5);
  }, [allListableGames, getSupportCount, isSubmittedGame, hasDevlogs]);

  const activeTabConfig =
    discoveryTabs.find((tab) => tab.id === discoveryTab) ?? discoveryTabs[0];

  const tabGamesRaw = useMemo(
    () =>
      getGamesForDiscoveryTab(
        discoveryTab,
        newGamesRaw,
        testerGamesRaw,
        allListableGames,
      ),
    [discoveryTab, newGamesRaw, testerGamesRaw, allListableGames],
  );

  const displayedGames = useMemo(() => {
    const searched = filterGames(tabGamesRaw, searchQuery);
    const filtered = applyDiscoveryChipFilters(searched, chipFilters);
    return sortGames(filtered, sortOption, getSupportCount, isSubmittedGame);
  }, [
    tabGamesRaw,
    searchQuery,
    chipFilters,
    sortOption,
    getSupportCount,
    isSubmittedGame,
  ]);

  const hasActiveFilter =
    searchQuery.trim().length > 0 || hasActiveChipFilters(chipFilters);
  const totalVisible = displayedGames.length;
  const totalAvailable = tabGamesRaw.length;

  function handleDiscoveryTabChange(tab: DiscoveryTab) {
    setDiscoveryTab(tab);
    setSortOption(getDefaultSortForTab(tab));
  }

  function scrollToDiscover() {
    document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="forge-page-bg min-h-full text-zinc-100">
      <ForgeHeader />

      <main>
        <section className="relative overflow-hidden border-b border-white/[0.06]">
          <div className="forge-hero-glow absolute inset-0" />
          <div className="forge-noise absolute inset-0 opacity-70" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_55%,#09090b_100%)]" />
          <div className="forge-hero-grid absolute inset-0 opacity-[0.35]" />

          <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-14 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.45fr)] lg:gap-10 xl:gap-12">
              <div className="mx-auto max-w-lg text-center lg:mx-0 lg:max-w-none lg:text-left">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-800/80 bg-zinc-900/50 px-4 py-1.5 text-sm font-semibold backdrop-blur-sm"
                >
                  <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                    Forge
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-400">Indie Discovery</span>
                </Link>

                <h1 className="mt-8 text-4xl font-bold leading-[1.15] tracking-tight text-zinc-50 sm:text-5xl lg:text-[2.75rem] lg:leading-[1.12] xl:text-5xl">
                  次にハマるゲームは、
                  <span className="bg-gradient-to-r from-orange-300 via-amber-200 to-orange-400 bg-clip-text text-transparent">
                    完成前に
                  </span>
                  見つかる。
                </h1>

                <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl lg:mx-0">
                  Forgeは、開発中のインディーゲームを見つけて、応援し、テスト参加できるプラットフォームです。
                </p>

                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                  <button
                    type="button"
                    onClick={scrollToDiscover}
                    className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-3.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-orange-500/25 transition-all hover:opacity-95 hover:shadow-orange-500/35 sm:w-auto"
                  >
                    ゲームを探す
                  </button>
                  <Link
                    href="/submit"
                    className="w-full rounded-xl border border-zinc-700/80 bg-zinc-900/60 px-8 py-3.5 text-center text-sm font-semibold text-zinc-100 backdrop-blur-sm transition-all hover:border-orange-500/40 hover:bg-zinc-900 sm:w-auto"
                  >
                    作品を投稿する
                  </Link>
                </div>
              </div>

              <div className="mx-auto w-full lg:max-w-none">
                <HeroGameShowcase
                  games={heroShowcaseGames}
                  loading={!dataReady}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6 pt-6 sm:pt-8">
          <DiscoveryFilterChips filters={chipFilters} onChange={setChipFilters} />
        </div>

        <div
          id="discover"
          className="mx-auto max-w-7xl scroll-mt-24 px-6 pt-8 sm:pt-10"
        >
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {discoveryTabs.map((tab) => {
                const isActive = discoveryTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleDiscoveryTabChange(tab.id)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                      isActive
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 shadow-lg shadow-orange-500/20"
                        : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            {!dataReady ? null : (
              <p className="text-sm text-zinc-600">{displayedGames.length}件</p>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5 backdrop-blur-sm sm:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-zinc-100">作品を探す</h2>
              <p className="mt-1 text-sm text-zinc-500">
                タイトル、作者名、ジャンルで絞り込みできます。
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="作品名・作者名・ジャンルで検索"
                className={inputClassName}
              />
              <select
                value={sortOption}
                onChange={(event) =>
                  setSortOption(event.target.value as SortOption)
                }
                className="rounded-xl border border-zinc-700/80 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 backdrop-blur-sm focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50 sm:w-48"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {hasActiveFilter && totalVisible === 0 && totalAvailable > 0 && (
            <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/90">
              条件に一致する作品が見つかりませんでした。フィルターや検索条件を変えてお試しください。
            </div>
          )}
        </div>

        <GameSection
          title={activeTabConfig.label}
          subtitle={activeTabConfig.subtitle}
          games={displayedGames}
          showNewBadge={discoveryTab === "new"}
          showTrendingBadge={discoveryTab === "trending"}
          loading={!dataReady}
          emptyMessage={
            hasActiveFilter
              ? "検索条件に一致する作品がありません。"
              : discoveryTab === "testers"
                ? "現在テストプレイ受付中の作品はありません。"
                : discoveryTab === "trending"
                  ? "急上昇作品はまだありません。"
                  : "新着作品はまだありません。"
          }
        />
      </main>

      <footer className="border-t border-zinc-800/80 py-10 text-center text-sm text-zinc-600">
        <p>&copy; {new Date().getFullYear()} Forge. 無断転載を禁じます。</p>
      </footer>
    </div>
  );
}
