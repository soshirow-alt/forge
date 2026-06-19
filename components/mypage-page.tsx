"use client";

import {
  AchievementsTabPanel,
  FeedbackTabPanel,
  FollowingTabPanel,
} from "@/components/mypage-v0-extra-tabs";
import {
  GameThumbnail,
  MyPageTabs,
  PlayerShell,
  SavedBadge,
  SortDropdown,
} from "@/components/player-shell";
import {
  genreFilters,
  playHistoryFilterTabs,
  PLAY_HISTORY_TOTAL,
  playHistoryGames,
  playHistorySidebarFilters,
  playHistorySummary,
  savedGames,
  supportedCreators,
  witnessingGames,
  witnessingQuickFilters,
} from "@/lib/mypage-v0-mock-data";
import { gameDetailHrefFromTitle } from "@/lib/game-detail-v0-mock-data";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";
import {
  Check,
  ChevronDown,
  LayoutGrid,
  List,
  MessageSquare,
  MoreVertical,
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
  return (
    <div className="mt-8 flex flex-col gap-8 xl:flex-row">
      <div className="min-w-0 flex-1">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">プレイ履歴</h1>
          <p className="mt-2 text-sm text-zinc-400">あなたがプレイしたゲームの記録です。</p>
        </header>

        <div className="mt-6 flex flex-wrap gap-2">
          {playHistoryFilterTabs.map((filter, index) => (
            <button
              key={filter.id}
              type="button"
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                index === 0
                  ? "bg-violet-600 text-white"
                  : "border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              }`}
            >
              {filter.label}
              <span className="ml-1 opacity-70">{filter.count}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <SortDropdown label="プレイ日時：新しい順" />
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
          {playHistoryGames.map((game) => (
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
                    <button
                      type="button"
                      className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                      aria-label="その他"
                    >
                      <MoreVertical className="size-4" />
                    </button>
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
                    <button
                      type="button"
                      className="mt-3 w-full rounded-lg border border-violet-500/40 px-3 py-2 text-xs text-violet-300 transition-colors hover:bg-violet-500/10"
                    >
                      更新内容を見る
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500">
          <p>
            {PLAY_HISTORY_TOTAL}件中 1–{playHistoryGames.length}件
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              className="rounded-lg border border-zinc-800 px-3 py-1.5 text-zinc-600"
            >
              前へ
            </button>
            <button
              type="button"
              className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-violet-300"
            >
              1
            </button>
            <button
              type="button"
              className="rounded-lg border border-zinc-800 px-3 py-1.5 transition-colors hover:border-zinc-700 hover:text-zinc-300"
            >
              2
            </button>
            <button
              type="button"
              className="rounded-lg border border-zinc-800 px-3 py-1.5 transition-colors hover:border-zinc-700 hover:text-zinc-300"
            >
              3
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

        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-semibold text-white">フィルター</h2>
          <div className="mt-4 space-y-2">
            {playHistorySidebarFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                className="flex w-full items-center justify-between rounded-lg border border-zinc-800 px-3 py-2 text-left text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
              >
                {filter}
                <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mt-3 text-xs text-violet-400 transition-colors hover:text-violet-300"
          >
            フィルターをリセット
          </button>
        </section>

        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">応援中の作者</h2>
            <button
              type="button"
              className="text-xs text-violet-400 transition-colors hover:text-violet-300"
            >
              すべて見る →
            </button>
          </div>
          <p className="mt-1 text-xs text-zinc-500">12人</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {supportedCreators.map((creator) => (
              <div key={creator.name} className="flex flex-col items-center gap-1">
                <span className="flex size-10 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-300">
                  {creator.initial}
                </span>
                <span className="max-w-[4.5rem] truncate text-[10px] text-zinc-500">
                  {creator.name}
                </span>
              </div>
            ))}
            <span className="flex size-10 items-center justify-center rounded-full border border-dashed border-zinc-700 text-xs text-zinc-500">
              +7
            </span>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-zinc-600">
            応援中の作者の新作・更新は通知でお知らせします。
          </p>
        </section>
      </aside>
    </div>
  );
}

function WitnessingTabPanel() {
  return (
    <div className="mt-8 flex flex-col gap-8 xl:flex-row">
      <div className="min-w-0 flex-1">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              見届け中の作品
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              あなたが声を届けた作品の変化を追いかけています。
            </p>
          </div>
          <SortDropdown />
        </header>

        <ul className="mt-8 space-y-4">
          {witnessingGames.map((game) => (
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
                    <button
                      type="button"
                      disabled={!game.hasUpdate}
                      className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {game.hasUpdate ? "今すぐ遊ぶ" : "アップデート待ち"}
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside className="w-full shrink-0 space-y-6 xl:w-72">
        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-semibold text-white">クイックフィルター</h2>
          <ul className="mt-4 space-y-2">
            {witnessingQuickFilters.map((filter) => (
              <li key={filter.label}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-200"
                >
                  <span>{filter.label}</span>
                  <span className="text-xs text-zinc-500">{filter.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-semibold text-white">ジャンルで絞り込む</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {genreFilters.map((genre, index) => (
              <button
                key={genre}
                type="button"
                className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                  index === 0
                    ? "bg-white text-zinc-950"
                    : "border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                }`}
              >
                {genre}
                {genre === "ストーリー" ? " ▾" : ""}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-semibold text-white">見届け中の作品とは？</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500">
            あなたが声を届けた作品や、継続的に変化を追っている作品です。
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            開発ログや更新内容を確認して、作品の成長を見届けましょう。
          </p>
          <button
            type="button"
            className="mt-4 text-sm font-medium text-violet-400 transition-colors hover:text-violet-300"
          >
            詳しく見る
          </button>
        </section>
      </aside>
    </div>
  );
}

function SavedTabPanel() {
  return (
    <div className="mt-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">保存作品</h1>
          <p className="mt-2 text-sm text-zinc-400">
            あとでプレイしたり、追いかけたい作品を保存できます。
          </p>
        </div>
        <SortDropdown />
      </header>

      <ul className="mt-8 space-y-3">
        {savedGames.map((game) => (
          <li
            key={game.title}
            className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-5"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <GameThumbnail src={game.image} alt={game.title} />
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-white">{game.title}</h3>
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
    </div>
  );
}

function MyPagePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));

  const setTab = useCallback(
    (tab: MyPageTab) => {
      router.replace(tabHref(tab));
    },
    [router],
  );

  return (
    <PlayerShell activeNav="mypage">
      <MyPageTabs activeTab={activeTab} onTabChange={(tab) => setTab(tab as MyPageTab)} />

      <div role="tabpanel">
        {activeTab === "witnessing" && <WitnessingTabPanel />}
        {activeTab === "saved" && <SavedTabPanel />}
        {activeTab === "play-history" && <PlayHistoryTabPanel />}
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
