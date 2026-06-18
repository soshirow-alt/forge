"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  GameThumbnail,
  PlayerShell,
  SortDropdown,
} from "@/components/player-shell";
import {
  SEARCH_RESULTS_TOTAL,
  searchGenreFilters,
  searchPlatformFilters,
  searchWorkResults,
} from "@/lib/search-v0-mock-data";
import {
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  Heart,
  LayoutGrid,
  List,
  MessageSquare,
} from "lucide-react";

const DEFAULT_QUERY = "ファンタジー";

function WorksSearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() || DEFAULT_QUERY;
  const shown = searchWorkResults.length;

  return (
    <PlayerShell activeNav="search" headerSearchDefault={query}>
      <div className="flex flex-col gap-8 xl:flex-row">
        <div className="min-w-0 flex-1">
          <nav className="text-sm text-zinc-500">
            <Link href="/" className="transition-colors hover:text-violet-400">
              ホーム（発見）
            </Link>
            <span className="mx-2">›</span>
            <span className="text-zinc-400">検索結果</span>
          </nav>

          <header className="mt-4">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              「{query}」の検索結果
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              {SEARCH_RESULTS_TOTAL.toLocaleString()}件の作品が見つかりました
            </p>
          </header>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <SortDropdown label="おすすめ順" />
            <div className="flex rounded-lg border border-zinc-800 p-0.5">
              <button
                type="button"
                className="rounded-md bg-violet-600 p-2 text-white"
                aria-label="リスト表示"
              >
                <List className="size-4" />
              </button>
              <button
                type="button"
                className="rounded-md p-2 text-zinc-500 transition-colors hover:text-zinc-300"
                aria-label="グリッド表示"
              >
                <LayoutGrid className="size-4" />
              </button>
            </div>
          </div>

          <ul className="mt-6 space-y-4">
            {searchWorkResults.map((work) => (
              <li
                key={work.id}
                className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700/80 sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <GameThumbnail
                    src={work.image}
                    alt={work.title}
                    className="h-28 w-full shrink-0 sm:h-32 sm:w-48"
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
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="inline-flex items-center gap-1">
                        <Heart className="size-3.5" aria-hidden="true" />
                        {work.likes}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="size-3.5" aria-hidden="true" />
                        {work.comments}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600">{work.platforms.join(" · ")}</p>
                  </div>
                  <button
                    type="button"
                    className="hidden self-center rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 lg:inline-flex"
                    aria-label="詳細"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500">
            <p>
              {SEARCH_RESULTS_TOTAL.toLocaleString()}件中 1–{shown}件
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled
                className="rounded-lg border border-zinc-800 px-3 py-1.5 text-zinc-600"
              >
                前へ
              </button>
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`rounded-lg border px-3 py-1.5 ${
                    page === 1
                      ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                      : "border-zinc-800 transition-colors hover:border-zinc-700 hover:text-zinc-300"
                  }`}
                >
                  {page}
                </button>
              ))}
              <span className="px-1 text-zinc-600">…</span>
              <button
                type="button"
                className="rounded-lg border border-zinc-800 px-3 py-1.5 transition-colors hover:border-zinc-700 hover:text-zinc-300"
              >
                25
              </button>
              <button
                type="button"
                className="rounded-lg border border-zinc-800 px-3 py-1.5 transition-colors hover:border-zinc-700 hover:text-zinc-300"
              >
                次へ
              </button>
            </div>
          </div>
        </div>

        <aside className="w-full shrink-0 xl:w-72">
          <section className="sticky top-24 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">絞り込み</h2>
              <button
                type="button"
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
                defaultValue={query}
                className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
              />
            </div>

            <fieldset className="mt-5">
              <legend className="text-xs font-medium text-zinc-500">ステータス</legend>
              <div className="mt-2 space-y-2">
                {["完成品", "開発中"].map((label) => (
                  <label key={label} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/40"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-5">
              <legend className="text-xs font-medium text-zinc-500">ジャンル</legend>
              <div className="mt-2 max-h-40 space-y-2 overflow-y-auto pr-1">
                {searchGenreFilters.map((genre, index) => (
                  <label
                    key={genre}
                    className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400"
                  >
                    <input
                      type="checkbox"
                      defaultChecked={index === 0}
                      className="size-4 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/40"
                    />
                    {genre}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-5">
              <legend className="text-xs font-medium text-zinc-500">プレイ環境</legend>
              <div className="mt-2 space-y-2">
                {searchPlatformFilters.map((platform, index) => (
                  <label
                    key={platform}
                    className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400"
                  >
                    <input
                      type="checkbox"
                      defaultChecked={index === 0}
                      className="size-4 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/40"
                    />
                    {platform}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-5">
              <legend className="text-xs font-medium text-zinc-500">その他</legend>
              <div className="mt-2 space-y-2">
                {["フォロー中の開発者の作品", "見届け中の作品のみ"].map((label) => (
                  <label key={label} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/40"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="button"
              className="mt-6 flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-opacity hover:opacity-90"
            >
              この条件で検索
              <ChevronDown className="size-4 rotate-[-90deg]" aria-hidden="true" />
            </button>
          </section>
        </aside>
      </div>
    </PlayerShell>
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
