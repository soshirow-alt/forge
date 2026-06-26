"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ForgeGameCardList,
  type ForgeGameCardBadge,
} from "@/components/forge-game-card";
import { MyPageUpdatesSection } from "@/components/mypage-updates-section";
import { PlayHistorySection } from "@/components/play-history-section";
import { useGames } from "@/components/games-provider";

function engagementBadge(id: string, label: string, emoji?: string): ForgeGameCardBadge[] {
  return [{ id, emoji, label }];
}

export function MyPageLoopPanel() {
  const { getWatchedGames, getPlayedGames, getBookmarkedGames } = useGames();

  const watchedGames = getWatchedGames();
  const playedGames = getPlayedGames();
  const bookmarkedGames = getBookmarkedGames();

  const loopGames = useMemo(() => {
    const map = new Map<string, (typeof playedGames)[number]>();
    for (const game of [...playedGames, ...watchedGames, ...bookmarkedGames]) {
      map.set(game.id, game);
    }
    return [...map.values()];
  }, [bookmarkedGames, playedGames, watchedGames]);

  const hasLoopActivity =
    loopGames.length > 0 ||
    watchedGames.length > 0 ||
    playedGames.length > 0;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-white">あなたの学習ループ</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          遊んだ作品・初声を送った作品・変化があった作品・確認依頼をここに集約します。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/home"
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-violet-500/40 hover:text-violet-200"
          >
            作品を探す
          </Link>
          <Link
            href="/mypage?tab=developer"
            className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-200 transition-colors hover:bg-violet-500/15"
          >
            開発作品を管理
          </Link>
        </div>
      </section>

      {(watchedGames.length > 0 || playedGames.length > 0) && (
        <MyPageUpdatesSection
          watchedGames={watchedGames}
          playedGames={playedGames}
        />
      )}

      <PlayHistorySection />

      {watchedGames.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">見届け中</h2>
          <ForgeGameCardList
            games={watchedGames}
            variant="compact"
            badgesForGame={() => engagementBadge("watching", "見届け中", "🔄")}
            detailLabel="詳細 →"
          />
        </section>
      ) : null}

      {bookmarkedGames.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">あとで遊ぶ</h2>
          <ForgeGameCardList
            games={bookmarkedGames}
            variant="compact"
            badgesForGame={() => engagementBadge("bookmark", "保存", "🔖")}
            detailLabel="詳細 →"
          />
        </section>
      ) : null}

      {!hasLoopActivity ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-16 text-center">
          <p className="text-zinc-400">まだループに関わる作品がありません。</p>
          <Link
            href="/home"
            className="mt-6 inline-block rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            作品を探す
          </Link>
        </div>
      ) : null}
    </div>
  );
}
