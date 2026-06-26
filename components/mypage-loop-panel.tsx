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

  const hasAnyActivity = useMemo(
    () =>
      watchedGames.length > 0 ||
      playedGames.length > 0 ||
      bookmarkedGames.length > 0,
    [bookmarkedGames.length, playedGames.length, watchedGames.length],
  );

  if (!hasAnyActivity) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-16 text-center">
        <h2 className="text-lg font-semibold text-zinc-200">
          見届けている作品はまだありません
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
          作品をプレイして「見届ける」と、開発者の更新や確認依頼がここに届きます。
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/home"
            className="inline-block rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            作品を探す
          </Link>
          <Link
            href="/mypage?tab=developer"
            className="inline-block rounded-lg border border-zinc-700 px-6 py-3 text-sm text-zinc-300 transition-colors hover:border-violet-500/40 hover:text-violet-200"
          >
            自分の作品を管理
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
    </div>
  );
}
