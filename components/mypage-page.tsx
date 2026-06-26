"use client";

import { ListControlsBar } from "@/components/list-controls-bar";
import { V0ExpandableHelp } from "@/components/v0-expandable-help";
import {
  FilterRadioGroup,
  MyPageFilterPanel,
  MyPageFilterSidebar,
  StatusFilterPills,
  type GenreFilter,
} from "@/components/mypage-filters";
import { type ViewMode } from "@/components/view-mode-toggle";
import {
  AchievementsTabPanel,
  FeedbackTabPanel,
  FollowingTabPanel,
} from "@/components/mypage-v0-extra-tabs";
import { MyPageLoopPanel } from "@/components/mypage-loop-panel";
import {
  MyPageSavedRealPanel,
} from "@/components/mypage-real-panels";
import { PlayHistorySection } from "@/components/play-history-section";
import { MyPageGameActionsMenu } from "@/components/mypage-game-actions-menu";
import {
  MYPAGE_LIST_PAGE_SIZE,
  MyPageListPagination,
  useMyPageListPagination,
} from "@/components/mypage-list-pagination";
import {
  GameThumbnail,
  MyPageTabs,
  PlayerShell,
  SavedBadge,
} from "@/components/player-shell";
import {
  playHistoryFilterTabs,
  playHistoryPeriodFilters,
  playHistorySortOptions,
  playHistoryGames,
  playHistorySummary,
  savedFilterTabs,
  savedGames,
  savedSortOptions,
  witnessingFilterTabs,
  witnessingGames,
  witnessingSortOptions,
} from "@/lib/mypage-v0-mock-data";
import {
  filterPlayHistoryGames,
  filterSavedGames,
  filterWitnessingGames,
  playHistoryStatusCounts,
  savedStatusCounts,
  witnessingStatusCounts,
} from "@/lib/mypage-list-filters";
import { gameDetailHrefFromTitle } from "@/lib/game-detail-v0-mock-data";
import {
  gamePlayEntryHref,
  gameUpdateDevlogHref,
} from "@/lib/mypage-navigation";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  MessageSquare,
  Pencil,
  Sparkles,
} from "lucide-react";

export type MyPageTab =
  | "witnessing"
  | "saved"
  | "play-history"
  | "feedback"
  | "achievements"
  | "following";

const TAB_IDS: MyPageTab[] = [
  "witnessing",
  "saved",
  "play-history",
  "feedback",
  "achievements",
  "following",
];

function parseTab(param: string | null): MyPageTab {
  if (!param || param === "witnessing") {
    return "witnessing";
  }
  return TAB_IDS.includes(param as MyPageTab) ? (param as MyPageTab) : "witnessing";
}

function tabHref(tab: MyPageTab): string {
  return tab === "witnessing" ? "/mypage" : `/mypage?tab=${tab}`;
}

const playHistoryTagClass = {
  witnessing: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  "play-only": "border-zinc-600 bg-zinc-800/60 text-zinc-400",
  supported: "border-rose-500/40 bg-rose-500/10 text-rose-300",
} as const;

function PlayHistoryTabPanel() {
  const [activeFilter, setActiveFilter] = useState<(typeof playHistoryFilterTabs)[number]["id"]>(
    playHistoryFilterTabs[0].id,
  );
  const [periodId, setPeriodId] = useState<(typeof playHistoryPeriodFilters)[number]["id"]>("all");
  const [genre, setGenre] = useState<GenreFilter>("すべて");
  const [sortId, setSortId] = useState<(typeof playHistorySortOptions)[number]["id"]>(
    playHistorySortOptions[0].id,
  );
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const statusOptions = useMemo(() => playHistoryStatusCounts(playHistoryGames), []);

  const filteredGames = useMemo(() => {
    let list = filterPlayHistoryGames(playHistoryGames, activeFilter, genre, periodId);
    if (sortId === "title-asc") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title, "ja"));
    } else if (sortId === "played-asc") {
      list = [...list].reverse();
    }
    return list;
  }, [activeFilter, genre, periodId, sortId]);

  const paginationResetKey = `${activeFilter}-${periodId}-${genre}-${sortId}`;
  const { pagination, page, setPage } = useMyPageListPagination(
    filteredGames,
    paginationResetKey,
  );
  const visibleGames = pagination.items;

  function resetFilters() {
    setActiveFilter("all");
    setPeriodId("all");
    setGenre("すべて");
  }

  return (
    <div className="mt-8 flex flex-col gap-8 xl:flex-row">
      <div className="min-w-0 flex-1">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">プレイ履歴</h1>
        </header>

        <StatusFilterPills
          options={statusOptions}
          activeId={activeFilter}
          onChange={setActiveFilter}
        />

        <div className="mt-4">
          <ListControlsBar
            sortId={sortId}
            sortOptions={playHistorySortOptions}
            onSortChange={setSortId}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {viewMode === "grid" ? (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {visibleGames.map((game) => (
              <li
                key={game.title}
                className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4"
              >
                <Link href={gameDetailHrefFromTitle(game.title)}>
                  <GameThumbnail src={game.image} alt={game.title} className="w-full aspect-video" />
                  <h3 className="mt-3 font-semibold text-white transition-colors hover:text-violet-300">
                    {game.title}
                  </h3>
                </Link>
                <p className="mt-1 text-xs text-zinc-500">最終プレイ {game.lastPlay}</p>
              </li>
            ))}
          </ul>
        ) : (
        <ul className="mt-6 space-y-4">
          {visibleGames.map((game) => (
            <li
              key={game.title}
              className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row">
                <GameThumbnail src={game.image} alt={game.title} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {game.tags.map((tag) => (
                        <span
                          key={tag.label}
                          className={`rounded-md border px-2 py-0.5 text-xs ${playHistoryTagClass[tag.variant]}`}
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                    <MyPageGameActionsMenu title={game.title} />
                  </div>

                  <h3 className="mt-2 text-lg font-semibold text-white">
                    <Link
                      href={gameDetailHrefFromTitle(game.title)}
                      className="transition-colors hover:text-violet-300"
                    >
                      {game.title}
                    </Link>{" "}
                    <span className="text-sm font-normal text-violet-400">{game.version}</span>
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">{game.description}</p>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-zinc-500">初回プレイ</p>
                      <p className="mt-0.5 text-sm text-zinc-300">{game.firstPlay}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">プレイ回数</p>
                      <p className="mt-0.5 text-sm text-zinc-300">{game.playCount}回</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">合計プレイ時間</p>
                      <p className="mt-0.5 text-sm text-zinc-300">{game.totalPlayTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">最終プレイ</p>
                      <p className="mt-0.5 text-sm text-zinc-300">{game.lastPlay}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {game.cleared && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                        <Check className="size-3.5" aria-hidden="true" />
                        クリア済み
                      </span>
                    )}
                    {game.feedbackSent && (
                      <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                        <MessageSquare className="size-3.5" aria-hidden="true" />
                        FB送信済
                      </span>
                    )}
                    {game.memo && (
                      <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                        <Pencil className="size-3.5" aria-hidden="true" />
                        メモあり
                      </span>
                    )}
                  </div>
                </div>

                {game.hasUpdate && (
                  <div className="w-full shrink-0 rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 lg:w-48">
                    <p className="inline-flex items-center gap-1 text-xs font-medium text-violet-300">
                      <Sparkles className="size-3.5" aria-hidden="true" />
                      更新あり
                    </p>
                    {game.updateVersion && (
                      <p className="mt-1 text-sm text-zinc-300">{game.updateVersion}</p>
                    )}
                    <Link
                      href={gameUpdateDevlogHref(game.title)}
                      className="mt-3 block w-full rounded-lg border border-violet-500/40 px-3 py-2 text-center text-xs text-violet-300 transition-colors hover:bg-violet-500/10"
                    >
                      更新内容を見る
                    </Link>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
        )}

        <MyPageListPagination
          totalItems={filteredGames.length}
          page={page}
          pageSize={MYPAGE_LIST_PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      <aside className="w-full shrink-0 space-y-6 xl:w-72">
        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-semibold text-white">プレイサマリー</h2>
          <ul className="mt-4 space-y-3">
            {playHistorySummary.map((item) => (
              <li key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">{item.label}</span>
                <span className="font-medium text-zinc-200">{item.value}</span>
              </li>
            ))}
          </ul>
        </section>

        <MyPageFilterPanel
          selectedGenre={genre}
          onGenreChange={setGenre}
          onReset={resetFilters}
        >
          <FilterRadioGroup
            label="プレイ期間"
            options={playHistoryPeriodFilters}
            value={periodId}
            onChange={setPeriodId}
          />
        </MyPageFilterPanel>
      </aside>
    </div>
  );
}

function WitnessingTabPanel() {
  const [activeFilter, setActiveFilter] = useState<(typeof witnessingFilterTabs)[number]["id"]>(
    witnessingFilterTabs[0].id,
  );
  const [genre, setGenre] = useState<GenreFilter>("すべて");
  const [sortId, setSortId] = useState<(typeof witnessingSortOptions)[number]["id"]>(
    witnessingSortOptions[0].id,
  );
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const statusOptions = useMemo(() => witnessingStatusCounts(witnessingGames), []);

  const filteredGames = useMemo(() => {
    let list = filterWitnessingGames(witnessingGames, activeFilter, genre);
    if (sortId === "title-asc") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title, "ja"));
    } else if (sortId === "updated-desc") {
      list = [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    return list;
  }, [activeFilter, genre, sortId]);

  function resetFilters() {
    setActiveFilter("all");
    setGenre("すべて");
  }

  return (
    <div className="mt-8 flex flex-col gap-8 xl:flex-row">
      <div className="min-w-0 flex-1">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            見届け中の作品
          </h1>
          <V0ExpandableHelp
            prompt="詳しく見る"
            teaser="見届け中の作品とは？ — 気になる作品を追い、更新や変化を見届けるリストです。"
          >
            <p>
              見届け人は、同じ作品を継続して追うプレイヤーのことです。Forge
              の必須条件ではありませんが、いると「変化を見る」「再プレイ」が起きやすくなります。
            </p>
            <p className="mt-2">
              この一覧では、見届け中の作品の更新や Devlog
              をまとめて確認できます。気になったら詳細からプレイやフィードバックへ進めます。
            </p>
          </V0ExpandableHelp>
        </header>

        <StatusFilterPills
          options={statusOptions}
          activeId={activeFilter}
          onChange={setActiveFilter}
        />

        <div className="mt-4">
          <ListControlsBar
            sortId={sortId}
            sortOptions={witnessingSortOptions}
            onSortChange={setSortId}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {viewMode === "grid" ? (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {filteredGames.map((game) => (
              <li
                key={game.title}
                className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4"
              >
                <GameThumbnail src={game.image} alt={game.title} className="w-full aspect-video" />
                <h3 className="mt-3 text-lg font-semibold text-white">{game.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{game.change}</p>
              </li>
            ))}
          </ul>
        ) : (
        <ul className="mt-8 space-y-4">
          {filteredGames.map((game) => (
            <li
              key={game.title}
              className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row">
                <GameThumbnail src={game.image} alt={game.title} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-white">
                    <Link
                      href={gameDetailHrefFromTitle(game.title)}
                      className="transition-colors hover:text-violet-300"
                    >
                      {game.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    <span className="text-zinc-500">今回の変化：</span>
                    {game.change}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">最終更新日： {game.updatedAt}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={gameDetailHrefFromTitle(game.title)}
                      className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
                    >
                      詳しく見る
                    </Link>
                    <Link
                      href={gamePlayEntryHref(game.title)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 ${
                        game.hasUpdate
                          ? "bg-white text-zinc-950"
                          : "pointer-events-none cursor-not-allowed bg-zinc-800 text-zinc-500 opacity-40"
                      }`}
                      aria-disabled={!game.hasUpdate}
                      tabIndex={game.hasUpdate ? 0 : -1}
                    >
                      {game.hasUpdate ? "今すぐ遊ぶ" : "アップデート待ち"}
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        )}
      </div>

      <MyPageFilterSidebar
        selectedGenre={genre}
        onGenreChange={setGenre}
        onReset={resetFilters}
      />
    </div>
  );
}

function SavedTabPanel() {
  const [activeFilter, setActiveFilter] = useState<(typeof savedFilterTabs)[number]["id"]>(
    savedFilterTabs[0].id,
  );
  const [genre, setGenre] = useState<GenreFilter>("すべて");
  const [sortId, setSortId] = useState<(typeof savedSortOptions)[number]["id"]>(
    savedSortOptions[0].id,
  );
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const statusOptions = useMemo(() => savedStatusCounts(savedGames), []);

  const filteredGames = useMemo(() => {
    let list = filterSavedGames(savedGames, activeFilter, genre);
    if (sortId === "title-asc") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title, "ja"));
    }
    return list;
  }, [activeFilter, genre, sortId]);

  function resetFilters() {
    setActiveFilter("all");
    setGenre("すべて");
  }

  return (
    <div className="mt-8 flex flex-col gap-8 xl:flex-row">
      <div className="min-w-0 flex-1">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">保存作品</h1>
        </header>

        <StatusFilterPills
          options={statusOptions}
          activeId={activeFilter}
          onChange={setActiveFilter}
        />

        <div className="mt-4">
          <ListControlsBar
            sortId={sortId}
            sortOptions={savedSortOptions}
            onSortChange={setSortId}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {viewMode === "grid" ? (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {filteredGames.map((game) => (
              <li
                key={game.title}
                className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4"
              >
                <GameThumbnail src={game.image} alt={game.title} className="w-full aspect-video" />
                <h3 className="mt-3 text-lg font-semibold text-white">{game.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">開発者： {game.developer}</p>
                <div className="mt-3">
                  <SavedBadge />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-8 space-y-3">
            {filteredGames.map((game) => (
              <li
                key={game.title}
                className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <GameThumbnail src={game.image} alt={game.title} />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-white">
                      <Link
                        href={gameDetailHrefFromTitle(game.title)}
                        className="transition-colors hover:text-violet-300"
                      >
                        {game.title}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500">開発者： {game.developer}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {game.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-zinc-700/80 bg-zinc-800/60 px-2.5 py-1 text-xs text-zinc-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <SavedBadge />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <aside className="w-full shrink-0 xl:w-72">
        <MyPageFilterPanel
          selectedGenre={genre}
          onGenreChange={setGenre}
          onReset={resetFilters}
        />
      </aside>
    </div>
  );
}

function MyPagePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  useEffect(() => {
    if (tabParam === "developer") {
      router.replace("/studio/mypage");
    }
  }, [router, tabParam]);

  const activeTab = parseTab(tabParam);

  const setTab = useCallback(
    (tab: MyPageTab) => {
      router.replace(tabHref(tab));
    },
    [router],
  );

  if (tabParam === "developer") {
    return (
      <PlayerShell activeNav="mypage">
        <p className="text-zinc-500">Studio へ移動しています…</p>
      </PlayerShell>
    );
  }

  return (
    <PlayerShell activeNav="mypage">
      <MyPageTabs activeTab={activeTab} onTabChange={(tab) => setTab(tab as MyPageTab)} />

      <div role="tabpanel">
        {activeTab === "witnessing" && <MyPageLoopPanel />}
        {activeTab === "saved" && <MyPageSavedRealPanel />}
        {activeTab === "play-history" && <PlayHistorySection />}
        {activeTab === "feedback" && <FeedbackTabPanel />}
        {activeTab === "achievements" && <AchievementsTabPanel />}
        {activeTab === "following" && <FollowingTabPanel />}
      </div>
    </PlayerShell>
  );
}

export function MyPagePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-[#0a0a0a] text-zinc-500">
          読み込み中...
        </div>
      }
    >
      <MyPagePageContent />
    </Suspense>
  );
}
