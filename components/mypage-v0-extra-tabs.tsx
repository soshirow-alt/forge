"use client";

import { ListControlsBar } from "@/components/list-controls-bar";
import { V0ExpandableHelp } from "@/components/v0-expandable-help";
import {
  FilterRadioGroup,
  MyPageFilterPanel,
  StatusFilterPills,
  type GenreFilter,
} from "@/components/mypage-filters";
import {
  MYPAGE_LIST_PAGE_SIZE,
  MyPageListPagination,
  useMyPageListPagination,
} from "@/components/mypage-list-pagination";
import { type ViewMode } from "@/components/view-mode-toggle";
import {
  GameThumbnail,
} from "@/components/player-shell";
import {
  achievementCategories,
  achievementProgress,
  achievementSortOptions,
  allAchievements,
  feedbackEntries,
  feedbackFilterTabs,
  feedbackReflectionFilters,
  feedbackSortOptions,
  feedbackStats,
  FOLLOWING_TOTAL,
  followingDevelopers,
  followingSortOptions,
  recentAchievements,
  recentFollowing,
} from "@/lib/mypage-v0-mock-data";
import {
  feedbackTypeCounts,
  filterFeedbackEntries,
  filterFollowingDevelopers,
  followingStatusCounts,
} from "@/lib/mypage-list-filters";
import {
  creatorProfileHref,
  gameDetailHrefWithTab,
  gamePlayEntryHref,
} from "@/lib/mypage-navigation";
import {
  Check,
  ChevronRight,
  Heart,
  Send,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

const FOLLOWING_LOAD_STEP = 4;

export function FeedbackTabPanel() {
  const [typeFilter, setTypeFilter] = useState<(typeof feedbackFilterTabs)[number]["id"]>(
    feedbackFilterTabs[0].id,
  );
  const [reflectionId, setReflectionId] = useState<
    (typeof feedbackReflectionFilters)[number]["id"]
  >("all");
  const [genre, setGenre] = useState<GenreFilter>("すべて");
  const [sortId, setSortId] = useState<(typeof feedbackSortOptions)[number]["id"]>(
    feedbackSortOptions[0].id,
  );
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const typeOptions = useMemo(() => feedbackTypeCounts(feedbackEntries), []);

  const filteredEntries = useMemo(() => {
    let list = filterFeedbackEntries(feedbackEntries, typeFilter, reflectionId, genre);
    if (sortId === "oldest") {
      list = [...list].reverse();
    } else if (sortId === "game-asc") {
      list = [...list].sort((a, b) => a.game.localeCompare(b.game, "ja"));
    }
    return list;
  }, [typeFilter, reflectionId, genre, sortId]);

  const paginationResetKey = `${typeFilter}-${reflectionId}-${genre}-${sortId}`;
  const { pagination, page, setPage } = useMyPageListPagination(
    filteredEntries,
    paginationResetKey,
  );
  const visibleEntries = pagination.items;

  function resetFilters() {
    setTypeFilter("all");
    setReflectionId("all");
    setGenre("すべて");
  }

  return (
    <div className="mt-8 flex flex-col gap-8 xl:flex-row">
      <div className="min-w-0 flex-1">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            フィードバック履歴
          </h1>
          <V0ExpandableHelp
            prompt="共感とは？ 詳しく見る"
            teaser="共感は、自由記述フィードバックへの「いいね」です。投稿数には加算されません。"
          >
            <p>
              共感は自由記述のフィードバックにだけ付けられます。1件の投稿に複数人が共感しても、投稿数は
              1 のままです。
            </p>
            <p className="mt-2">
              開発者の意思決定や影響度スコアでは、共感の重みが反映されます。あなたの言葉が多くの人に刺さったとき、ここに表示されます。
            </p>
          </V0ExpandableHelp>
        </header>

        <StatusFilterPills
          options={typeOptions}
          activeId={typeFilter}
          onChange={setTypeFilter}
        />

        <div className="mt-4">
          <ListControlsBar
            sortId={sortId}
            sortOptions={feedbackSortOptions}
            onSortChange={setSortId}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {viewMode === "grid" ? (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {visibleEntries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4"
              >
                <GameThumbnail src={entry.image} alt={entry.game} className="w-full aspect-video" />
                <h3 className="mt-3 font-semibold text-white">{entry.game}</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  {entry.version} · {entry.timestamp}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
                  {entry.type === "free" ? entry.content : entry.choices?.[0]?.answer}
                </p>
              </li>
            ))}
          </ul>
        ) : (
        <ul className="mt-6 space-y-4">
          {visibleEntries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row">
                <GameThumbnail src={entry.image} alt={entry.game} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{entry.game}</h3>
                    <span className="text-sm text-violet-400">{entry.version}</span>
                    <span className="text-xs text-zinc-500">{entry.timestamp}</span>
                  </div>

                  {entry.type === "free" ? (
                    <div className="mt-3">
                      <span className="rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-xs text-zinc-400">
                        自由記述
                      </span>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                        {entry.content}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <span className="rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-xs text-zinc-400">
                        選択式
                      </span>
                      {entry.choices?.map((choice) => (
                        <p key={choice.question} className="text-sm text-zinc-400">
                          <span className="text-zinc-500">{choice.question}</span> →{" "}
                          <span className="text-zinc-200">{choice.answer}</span>
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
                    <span className="inline-flex items-center gap-1 text-zinc-500">
                      <Send className="size-3.5" aria-hidden="true" />
                      送信済
                    </span>
                    {entry.empathyCount !== undefined && (
                      <span className="inline-flex items-center gap-1 text-zinc-400">
                        <Heart className="size-3.5" aria-hidden="true" />
                        共感 {entry.empathyCount}人
                      </span>
                    )}
                    {entry.reflected && (
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <Check className="size-3.5" aria-hidden="true" />
                        改善で反映された（{entry.reflected.version}）
                      </span>
                    )}
                  </div>
                  {entry.reflected?.note && (
                    <p className="mt-2 text-xs text-zinc-500">{entry.reflected.note}</p>
                  )}
                </div>
                <Link
                  href={gameDetailHrefWithTab(entry.game, "voices")}
                  className="self-start rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 lg:self-center"
                  aria-label={`${entry.game}のフィードバックを見る`}
                >
                  <ChevronRight className="size-5" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
        )}

        <MyPageListPagination
          totalItems={filteredEntries.length}
          page={page}
          pageSize={MYPAGE_LIST_PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      <aside className="w-full shrink-0 space-y-6 xl:w-72">
        <MyPageFilterPanel
          selectedGenre={genre}
          onGenreChange={setGenre}
          onReset={resetFilters}
        >
          <FilterRadioGroup
            label="反映状況"
            options={feedbackReflectionFilters}
            value={reflectionId}
            onChange={setReflectionId}
          />
        </MyPageFilterPanel>

        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-semibold text-white">あなたのフィードバック統計</h2>
          <ul className="mt-4 space-y-3">
            {feedbackStats.map((item) => (
              <li key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">{item.label}</span>
                <span className="font-medium text-zinc-200">{item.value}</span>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}

export function AchievementsTabPanel() {
  const inProgress = allAchievements.filter((item) => !item.earned);
  const [category, setCategory] = useState<string>("すべて");
  const [sortId, setSortId] = useState<(typeof achievementSortOptions)[number]["id"]>(
    achievementSortOptions[0].id,
  );
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const allAchievementsRef = useRef<HTMLElement>(null);

  const sortedAchievements = useMemo(() => {
    let list = [...allAchievements];
    if (category !== "すべて") {
      list = list.filter((item) => item.category === category);
    }
    if (sortId === "title-asc") {
      list.sort((a, b) => a.title.localeCompare(b.title, "ja"));
    } else if (sortId === "earned-desc") {
      list.sort((a, b) => {
        if (a.earned !== b.earned) {
          return Number(b.earned) - Number(a.earned);
        }
        return (b.earnedDate ?? "").localeCompare(a.earnedDate ?? "");
      });
    } else if (sortId === "progress") {
      list.sort((a, b) => {
        if (a.earned !== b.earned) {
          return Number(a.earned) - Number(b.earned);
        }
        const aRatio = a.progress ? a.progress.current / a.progress.target : 1;
        const bRatio = b.progress ? b.progress.current / b.progress.target : 1;
        return bRatio - aRatio;
      });
    }
    return list;
  }, [category, sortId]);

  return (
    <div className="mt-8 space-y-8">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">実績</h1>
        </header>

      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-300">
              <Trophy className="size-7" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm text-zinc-500">獲得済みの実績</p>
              <p className="text-2xl font-bold text-white">
                {achievementProgress.earned}{" "}
                <span className="text-lg font-normal text-zinc-500">
                  / {achievementProgress.total}
                </span>
              </p>
            </div>
          </div>
          <p className="text-sm text-zinc-400">
            達成率{" "}
            <span className="font-semibold text-violet-300">{achievementProgress.percent}%</span>
          </p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
            style={{ width: `${achievementProgress.percent}%` }}
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">最近獲得した実績</h2>
          <button
            type="button"
            onClick={() =>
              allAchievementsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className="text-sm text-violet-400 transition-colors hover:text-violet-300"
          >
            すべて見る →
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {recentAchievements.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 text-center"
            >
              <span className="text-3xl" role="img" aria-hidden="true">
                {item.emoji}
              </span>
              <p className="mt-2 text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{item.description}</p>
              {item.earnedDate && (
                <p className="mt-2 text-[10px] text-violet-400">{item.earnedDate} 獲得</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section ref={allAchievementsRef}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-white">すべての実績</h2>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {["すべて", ...achievementCategories].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                category === item
                  ? "bg-violet-600 text-white"
                  : "border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <ListControlsBar
            sortId={sortId}
            sortOptions={achievementSortOptions}
            onSortChange={setSortId}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {viewMode === "list" ? (
          <ul className="mt-6 space-y-3">
            {sortedAchievements.map((item) => (
              <li
                key={item.id}
                className={`rounded-2xl border p-4 sm:p-5 ${
                  item.earned
                    ? "border-violet-500/30 bg-violet-500/5"
                    : "border-zinc-800/80 bg-zinc-900/40"
                }`}
              >
                <div className="flex gap-4">
                  <span
                    className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl ${
                      item.earned ? "bg-violet-500/20" : "bg-zinc-800 grayscale"
                    }`}
                    role="img"
                    aria-hidden="true"
                  >
                    {item.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-white">{item.title}</h3>
                      {item.earned && (
                        <span className="rounded-md bg-violet-500/20 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                          獲得済み
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">{item.description}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {sortedAchievements.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border p-4 sm:p-5 ${
                item.earned
                  ? "border-violet-500/30 bg-violet-500/5"
                  : "border-zinc-800/80 bg-zinc-900/40"
              }`}
            >
              <div className="flex gap-4">
                <span
                  className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl ${
                    item.earned ? "bg-violet-500/20" : "bg-zinc-800 grayscale"
                  }`}
                  role="img"
                  aria-hidden="true"
                >
                  {item.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    {item.earned && (
                      <span className="rounded-md bg-violet-500/20 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                        獲得済み
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">{item.description}</p>
                  {item.earned && item.earnedDate && (
                    <p className="mt-2 text-xs text-zinc-600">獲得日: {item.earnedDate}</p>
                  )}
                  {!item.earned && item.progress && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-zinc-500">
                        <span>進行中</span>
                        <span>
                          {item.progress.current} / {item.progress.target}
                          {item.progress.unit}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-violet-500"
                          style={{
                            width: `${(item.progress.current / item.progress.target) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {inProgress.length > 0 && (
          <p className="mt-6 text-center text-xs text-zinc-600">
            実績は今後も追加されていきます。楽しみながら、あなたらしい関わり方を見つけてください。
          </p>
        )}
      </section>
    </div>
  );
}

export function FollowingTabPanel() {
  const [statusFilter, setStatusFilter] = useState<"all" | "developing" | "released">("all");
  const [sortId, setSortId] = useState<(typeof followingSortOptions)[number]["id"]>(
    followingSortOptions[0].id,
  );
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [visibleCount, setVisibleCount] = useState(FOLLOWING_LOAD_STEP);
  const listTopRef = useRef<HTMLDivElement>(null);

  const statusOptions = useMemo(() => followingStatusCounts(followingDevelopers), []);

  const filteredDevelopers = useMemo(() => {
    let list = filterFollowingDevelopers(followingDevelopers, statusFilter);
    if (sortId === "name-asc") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, "ja"));
    } else if (sortId === "followers-desc") {
      list = [...list].sort((a, b) => b.followers - a.followers);
    }
    return list;
  }, [sortId, statusFilter]);

  const visibleDevelopers = filteredDevelopers.slice(0, visibleCount);
  const hasMore = visibleCount < filteredDevelopers.length;

  function handleStatusChange(id: "all" | "developing" | "released") {
    setStatusFilter(id);
    setVisibleCount(FOLLOWING_LOAD_STEP);
  }

  function handleLoadMore() {
    setVisibleCount((current) => Math.min(current + FOLLOWING_LOAD_STEP, filteredDevelopers.length));
  }

  function scrollToListTop() {
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mt-8 flex flex-col gap-8 xl:flex-row">
      <div className="min-w-0 flex-1">
        <header>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              フォロー中の開発者
            </h1>
            <span className="rounded-full bg-violet-500/20 px-3 py-1 text-sm font-medium text-violet-300">
              {FOLLOWING_TOTAL}人
            </span>
          </div>
        </header>

        <div ref={listTopRef}>
          <StatusFilterPills
            options={statusOptions}
            activeId={statusFilter}
            onChange={handleStatusChange}
          />
        </div>

        <div className="mt-4">
          <ListControlsBar
            sortId={sortId}
            sortOptions={followingSortOptions}
            onSortChange={setSortId}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {viewMode === "grid" ? (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {visibleDevelopers.map((dev) => (
              <li
                key={dev.id}
                className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-300">
                    {dev.initial}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white">{dev.name}</h3>
                    <p className="text-xs text-zinc-500">
                      フォロワー {dev.followers.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3">
                  <GameThumbnail
                    src={dev.game.image}
                    alt={dev.game.title}
                    className="size-14 shrink-0"
                  />
                  <p className="text-sm font-medium text-white">{dev.game.title}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
        <ul className="mt-6 space-y-4">
          {visibleDevelopers.map((dev) => (
            <li
              key={dev.id}
              className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <div className="flex min-w-0 flex-1 gap-4">
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-lg font-semibold text-zinc-300">
                    {dev.initial}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{dev.name}</h3>
                      {dev.badge && (
                        <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                          {dev.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">{dev.bio}</p>
                    <p className="mt-2 text-xs text-zinc-600">
                      フォロワー {dev.followers.toLocaleString()} · 見届け{" "}
                      {dev.watching.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3 sm:flex-row sm:items-center lg:w-80">
                  <GameThumbnail
                    src={dev.game.image}
                    alt={dev.game.title}
                    className="size-16 shrink-0 sm:size-20"
                  />
                  <div className="min-w-0 flex-1">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                        dev.game.status === "developing"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-violet-500/10 text-violet-300"
                      }`}
                    >
                      {dev.game.status === "developing" ? "開発中" : "完成品あり"}
                    </span>
                    <p className="mt-1 text-sm font-medium text-white">{dev.game.title}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {dev.game.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2 lg:flex-col">
                  <Link
                    href={creatorProfileHref(dev.id)}
                    className="rounded-lg border border-zinc-700 px-4 py-2 text-center text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
                  >
                    プロフィールへ
                  </Link>
                  <Link
                    href={gamePlayEntryHref(dev.game.title)}
                    className="rounded-lg border border-zinc-800 px-4 py-2 text-center text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
                  >
                    作品を見る
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
        )}

        {hasMore ? (
          <button
            type="button"
            onClick={handleLoadMore}
            className="mt-6 w-full rounded-xl border border-zinc-800 py-3 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
          >
            さらに読み込む（残り {filteredDevelopers.length - visibleCount}人）
          </button>
        ) : (
          <p className="mt-6 text-center text-xs text-zinc-600">
            {filteredDevelopers.length}人を表示中
          </p>
        )}
      </div>

      <aside className="w-full shrink-0 space-y-6 xl:w-72">
        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 text-center">
          <p className="text-sm text-zinc-500">フォロー数</p>
          <p className="mt-1 text-3xl font-bold text-white">{FOLLOWING_TOTAL}人</p>
        </section>

        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-semibold text-white">最近フォローした開発者</h2>
          <ul className="mt-4 space-y-3">
            {recentFollowing.map((item) => (
              <li key={item.name} className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-300">
                  {item.initial}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-zinc-200">{item.name}</p>
                  <p className="text-xs text-zinc-600">{item.date}</p>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={scrollToListTop}
            className="mt-4 text-xs text-violet-400 transition-colors hover:text-violet-300"
          >
            すべてのフォロー履歴を見る →
          </button>
        </section>

        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
          <Link
            href="/search/creators"
            className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-violet-300"
          >
            <Users className="size-4 text-violet-400" aria-hidden="true" />
            <span>開発者を探す</span>
          </Link>
          <p className="mt-2 text-xs leading-relaxed text-zinc-600">
            気になる開発者をフォローして、新作や更新を逃さないようにしましょう。
          </p>
        </section>
      </aside>
    </div>
  );
}
