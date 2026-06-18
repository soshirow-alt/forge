"use client";

import {
  EmptyTabState,
  GameThumbnail,
  MyPageTabs,
  PlayerShell,
  SavedBadge,
  SortDropdown,
} from "@/components/player-shell";
import {
  genreFilters,
  savedGames,
  witnessingGames,
  witnessingQuickFilters,
} from "@/lib/mypage-v0-mock-data";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";

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
                  <h3 className="text-lg font-semibold text-white">{game.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    <span className="text-zinc-500">今回の変化：</span>
                    {game.change}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">最終更新日： {game.updatedAt}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
                    >
                      詳しく見る
                    </button>
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
    <PlayerShell>
      <MyPageTabs activeTab={activeTab} onTabChange={(tab) => setTab(tab as MyPageTab)} />

      <div role="tabpanel">
        {activeTab === "witnessing" && <WitnessingTabPanel />}
        {activeTab === "saved" && <SavedTabPanel />}
        {activeTab === "play-history" && (
          <div className="mt-8">
            <EmptyTabState
              title="プレイ履歴"
              description="プレイした作品の履歴がここに表示されます。まだプレイ履歴はありません。"
            />
          </div>
        )}
        {activeTab === "feedback" && (
          <div className="mt-8">
            <EmptyTabState
              title="FB履歴"
              description="送ったフィードバックの履歴がここに表示されます。まだフィードバック履歴はありません。"
            />
          </div>
        )}
        {activeTab === "achievements" && (
          <div className="mt-8">
            <EmptyTabState
              title="実績"
              description="プレイやフィードバックで獲得した実績がここに表示されます。"
            />
          </div>
        )}
        {activeTab === "following" && (
          <div className="mt-8">
            <EmptyTabState
              title="フォロー中開発者"
              description="フォローしている開発者がここに表示されます。"
            />
          </div>
        )}
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
