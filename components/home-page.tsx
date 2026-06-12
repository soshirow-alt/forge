"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookmarkButton } from "@/components/bookmark-button";
import { DevlogUpdateBadge } from "@/components/devlog-update-badge";
import { ForgeHeader } from "@/components/forge-header";
import { CreatorLink } from "@/components/creator-link";
import { GameTags } from "@/components/game-tags";
import { GameThumbnail } from "@/components/game-thumbnail";
import { PlayTypeLabel } from "@/components/play-type-label";
import { useGames } from "@/components/games-provider";
import { filterGames, sortGames, type SortOption } from "@/lib/game-filters";
import type { Game } from "@/lib/mock-games";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "新着順" },
  { value: "support", label: "応援数順" },
  { value: "updated", label: "更新日順" },
  { value: "testers", label: "テスター募集中" },
];

const inputClassName =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50";

function GameCard({
  id,
  title,
  creator,
  genre,
  status,
  thumbnailUrl,
  tags,
  playUrl,
}: Pick<Game, "id" | "title" | "creator" | "genre" | "status" | "thumbnailUrl" | "tags" | "playUrl">) {
  return (
    <article className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 transition-all hover:-translate-y-0.5 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/20">
      <Link
        href={`/games/${id}`}
        className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
      >
        <GameThumbnail thumbnailUrl={thumbnailUrl} status={status} />
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-zinc-100 transition-colors group-hover:text-orange-400">
              {title}
            </h3>
            <DevlogUpdateBadge projectId={id} />
          </div>
          <p className="mt-1 text-sm text-zinc-500">{genre}</p>
          <div className="mt-2">
            <PlayTypeLabel playUrl={playUrl} />
          </div>
          <GameTags tags={tags} />
          <p className="mt-3 text-sm font-medium text-orange-400/80 transition-colors group-hover:text-orange-400">
            詳細を見る →
          </p>
        </div>
      </Link>
      <div className="flex items-center justify-between gap-3 border-t border-zinc-800/80 px-4 py-3">
        <CreatorLink name={creator} />
        <BookmarkButton gameId={id} compact />
      </div>
    </article>
  );
}

function TesterGameCard({
  id,
  title,
  creator,
  genre,
  status,
  thumbnailUrl,
  testerSlots,
  tags,
  playUrl,
}: Pick<
  Game,
  "id" | "title" | "creator" | "genre" | "status" | "thumbnailUrl" | "testerSlots" | "tags" | "playUrl"
>) {
  return (
    <article className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 transition-all hover:-translate-y-0.5 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/20">
      <Link
        href={`/games/${id}`}
        className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
      >
        <GameThumbnail thumbnailUrl={thumbnailUrl} status={status} />
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-zinc-100 transition-colors group-hover:text-orange-400">
              {title}
            </h3>
            <DevlogUpdateBadge projectId={id} />
          </div>
          <p className="mt-1 text-sm text-zinc-500">{genre}</p>
          <div className="mt-2">
            <PlayTypeLabel playUrl={playUrl} />
          </div>
          <GameTags tags={tags} />
          <p className="mt-3 text-sm font-medium text-orange-400">テスター募集中</p>
          <p className="mt-1 text-sm text-zinc-400">
            募集人数: {testerSlots ?? 0}人
          </p>
          <p className="mt-3 text-sm font-medium text-orange-400/80 transition-colors group-hover:text-orange-400">
            詳細を見る →
          </p>
        </div>
      </Link>
      <div className="flex items-center justify-between gap-3 border-t border-zinc-800/80 px-4 py-3">
        <CreatorLink name={creator} />
        <BookmarkButton gameId={id} compact />
      </div>
    </article>
  );
}

function GameSection({
  title,
  subtitle,
  games,
  variant = "default",
}: {
  title: string;
  subtitle: string;
  games: Game[];
  variant?: "default" | "testers";
}) {
  if (games.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 text-zinc-500">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) =>
          variant === "testers" ? (
            <TesterGameCard key={game.id} {...game} />
          ) : (
            <GameCard key={game.id} {...game} />
          ),
        )}
      </div>
    </section>
  );
}

export function HomePage() {
  const { getGamesBySection, getSupportCount, isSubmittedGame } = useGames();
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

  const newGames = useMemo(
    () => processGames(getGamesBySection("new")),
    [processGames, getGamesBySection],
  );
  const testerGames = useMemo(
    () => processGames(getGamesBySection("testers")),
    [processGames, getGamesBySection],
  );
  const betaGames = useMemo(
    () => processGames(getGamesBySection("beta")),
    [processGames, getGamesBySection],
  );

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <ForgeHeader />

      <main>
        <section className="relative overflow-hidden border-b border-zinc-800/80">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.08),transparent_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(9,9,11,1)_80%)]" />
          <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
                <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                  Forge
                </span>
              </h1>
              <p className="mt-6 text-lg text-zinc-400 sm:text-xl">
                開発中のゲームを見つけて、応援しよう
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <button
                  type="button"
                  className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90 sm:w-auto"
                >
                  ゲームを探す
                </button>
                <Link
                  href="/submit"
                  className="w-full rounded-lg border border-zinc-700 px-8 py-3 text-center text-sm font-semibold text-zinc-200 transition-colors hover:border-orange-500/50 hover:bg-zinc-900 sm:w-auto"
                >
                  作品を投稿する
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-4 px-6 pt-12">
          <p className="text-sm text-zinc-500">
            気になる作品カードをクリックすると詳細ページを見られます。
          </p>
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
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50 sm:w-48"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <GameSection
          title="新着作品"
          subtitle="開発が始まったばかりの作品"
          games={newGames}
        />

        {(newGames.length > 0 && (testerGames.length > 0 || betaGames.length > 0)) && (
          <div className="mx-auto h-px max-w-7xl bg-zinc-800/80" />
        )}

        <GameSection
          title="テスター募集中"
          subtitle="リリース前の作品を一緒に作り上げよう"
          games={testerGames}
          variant="testers"
        />

        {testerGames.length > 0 && betaGames.length > 0 && (
          <div className="mx-auto h-px max-w-7xl bg-zinc-800/80" />
        )}

        <GameSection
          title="β版の作品"
          subtitle="より多くのプレイヤー向けに整えられたビルド"
          games={betaGames}
        />
      </main>

      <footer className="border-t border-zinc-800/80 py-8 text-center text-sm text-zinc-600">
        <p>&copy; {new Date().getFullYear()} Forge. 無断転載を禁じます。</p>
      </footer>
    </div>
  );
}
