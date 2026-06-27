"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ForgeGameCardList,
  type ForgeGameCardBadge,
} from "@/components/forge-game-card";
import { useGames } from "@/components/games-provider";
import { WATCH_BADGE_LABEL, WATCH_LIST_TITLE } from "@/lib/watch-ui-labels";

function engagementBadge(id: string, label: string, emoji?: string): ForgeGameCardBadge[] {
  return [{ id, emoji, label }];
}

export function MyPageSavedRealPanel() {
  const { getBookmarkedGames } = useGames();
  const bookmarkedGames = getBookmarkedGames();

  if (bookmarkedGames.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-16 text-center">
        <p className="text-zinc-400">保存した作品はまだありません。</p>
        <Link
          href="/search"
          className="mt-6 inline-block rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
        >
          作品を探す
        </Link>
      </div>
    );
  }

  return (
    <ForgeGameCardList
      games={bookmarkedGames}
      variant="compact"
      badgesForGame={() => engagementBadge("bookmark", "保存", "🔖")}
      detailLabel="詳細 →"
    />
  );
}

export function MyPageWitnessingRealPanel() {
  const { getWatchedGames } = useGames();
  const watchedGames = getWatchedGames();

  const content = useMemo(() => {
    if (watchedGames.length === 0) {
      return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-16 text-center">
          <p className="text-zinc-400">{WATCH_LIST_TITLE}はまだありません。</p>
          <Link
            href="/home"
            className="mt-6 inline-block rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            作品を探す
          </Link>
        </div>
      );
    }

    return (
      <ForgeGameCardList
        games={watchedGames}
        variant="compact"
        badgesForGame={() => engagementBadge("watching", WATCH_BADGE_LABEL, "🔄")}
        detailLabel="詳細 →"
      />
    );
  }, [watchedGames]);

  return content;
}
