"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { BookmarkButton } from "@/components/bookmark-button";
import { ForgeHeader } from "@/components/forge-header";
import { CreatorLink } from "@/components/creator-link";
import { GameTags } from "@/components/game-tags";
import { GameThumbnail } from "@/components/game-thumbnail";
import { useGames } from "@/components/games-provider";
import { filterGames, sortGames, type SortOption } from "@/lib/game-filters";
import { getPlayTypeLabel } from "@/lib/game-links";
import type { Game } from "@/lib/mock-games";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "新着順" },
  { value: "support", label: "応援数順" },
  { value: "updated", label: "更新日順" },
  { value: "testers", label: "テスター募集中" },
];

const inputClassName =
  "w-full rounded-xl border border-zinc-700/80 bg-zinc-900/80 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 backdrop-blur-sm focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50";

type BadgeVariant = "new" | "tester" | "play" | "update" | "phase";

const badgeStyles: Record<BadgeVariant, string> = {
  new: "border-orange-500/35 bg-orange-500/10 text-orange-300",
  tester: "border-violet-500/35 bg-violet-500/10 text-violet-300",
  play: "border-sky-500/35 bg-sky-500/10 text-sky-300",
  update: "border-amber-500/35 bg-amber-500/10 text-amber-300",
  phase: "border-zinc-600/50 bg-zinc-950/70 text-zinc-300",
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
}: {
  game: Game;
  showNewBadge?: boolean;
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
            showStatus={false}
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {showNewBadge && <DiscoveryBadge variant="new">新着</DiscoveryBadge>}
            {game.lookingForTesters && (
              <DiscoveryBadge variant="tester">テスター募集中</DiscoveryBadge>
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
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <DiscoveryBadge variant="play">{playLabel}</DiscoveryBadge>
            {hasUpdate && <DiscoveryBadge variant="update">更新あり</DiscoveryBadge>}
          </div>

          <GameTags tags={game.tags} />

          {game.lookingForTesters && game.testerSlots !== undefined && (
            <p className="mt-3 text-sm text-violet-300/90">
              テスター募集 {game.testerSlots}人
            </p>
          )}

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
  loading = false,
  emptyMessage,
}: {
  title: string;
  subtitle: string;
  games: Game[];
  showNewBadge?: boolean;
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
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function HomePage() {
  const { getGamesBySection, getSupportCount, isSubmittedGame, dataReady } =
    useGames();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");

  const processGames = useMemo(
    () => (games: Game[]) =>
      sortGames(
        filterGames(games, searchQuery),
        sortOption,
        getSupportCount,
        isSubmittedGame,
      ),
    [searchQuery, sortOption, getSupportCount, isSubmittedGame],
  );

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

  const newGames = useMemo(
    () => processGames(newGamesRaw),
    [processGames, newGamesRaw],
  );
  const testerGames = useMemo(
    () => processGames(testerGamesRaw),
    [processGames, testerGamesRaw],
  );
  const betaGames = useMemo(
    () => processGames(betaGamesRaw),
    [processGames, betaGamesRaw],
  );

  const hasActiveFilter = searchQuery.trim().length > 0;
  const totalVisible = newGames.length + testerGames.length + betaGames.length;
  const totalAvailable =
    newGamesRaw.length + testerGamesRaw.length + betaGamesRaw.length;

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
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_40%,#09090b_100%)]" />

          <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 sm:pb-28 sm:pt-20 lg:pb-32 lg:pt-24">
            <div className="mx-auto max-w-4xl text-center">
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

              <h1 className="mt-8 text-4xl font-bold leading-[1.15] tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
                次にハマるゲームは、
                <span className="bg-gradient-to-r from-orange-300 via-amber-200 to-orange-400 bg-clip-text text-transparent">
                  完成前に
                </span>
                見つかる。
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
                Forgeは、開発中のインディーゲームを見つけて、応援し、テスト参加できるプラットフォームです。
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
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
          </div>
        </section>

        <div
          id="discover"
          className="mx-auto max-w-7xl scroll-mt-24 px-6 pt-12 sm:pt-16"
        >
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
              条件に一致する作品が見つかりませんでした。検索ワードを変えてお試しください。
            </div>
          )}
        </div>

        <GameSection
          title="新着作品"
          subtitle="公開されたばかりのインディーゲーム。完成前の作品だからこそ、最初の応援者になれる。"
          games={newGames}
          showNewBadge
          loading={!dataReady}
          emptyMessage={
            hasActiveFilter
              ? "検索条件に一致する新着作品がありません。"
              : "新着作品はまだありません。最初の作品を投稿してみましょう。"
          }
        />

        {(newGames.length > 0 ||
          testerGames.length > 0 ||
          betaGames.length > 0 ||
          !dataReady) && (
          <div className="mx-auto h-px max-w-7xl bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        )}

        <GameSection
          title="テスター募集中"
          subtitle="プレイフィードバックで開発を支える。リリース前のビルドを試して、クリエイターに届けよう。"
          games={testerGames}
          loading={!dataReady}
          emptyMessage={
            hasActiveFilter
              ? "検索条件に一致する募集作品がありません。"
              : "現在テスター募集中的な作品はありません。"
          }
        />

        {(testerGames.length > 0 || betaGames.length > 0 || !dataReady) && (
          <div className="mx-auto h-px max-w-7xl bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        )}

        <GameSection
          title="β版の作品"
          subtitle="より多くのプレイヤー向けに整えられたビルド。公開に近い段階の作品をチェック。"
          games={betaGames}
          loading={!dataReady}
          emptyMessage={
            hasActiveFilter
              ? "検索条件に一致するβ版作品がありません。"
              : "現在表示できるβ版作品はありません。"
          }
        />
      </main>

      <footer className="border-t border-zinc-800/80 py-10 text-center text-sm text-zinc-600">
        <p>&copy; {new Date().getFullYear()} Forge. 無断転載を禁じます。</p>
      </footer>
    </div>
  );
}
