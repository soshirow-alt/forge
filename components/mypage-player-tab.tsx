"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CreatorLink } from "@/components/creator-link";
import {
  MyPageCompactGameList,
  MyPageDashboardCard,
} from "@/components/mypage-dashboard-card";
import { MyPageUpdatesSection } from "@/components/mypage-updates-section";
import { PlayHistorySection } from "@/components/play-history-section";
import { VoiceAdoptionsSection } from "@/components/voice-adoptions-section";
import { PlayTypeLabel } from "@/components/play-type-label";
import { useGames } from "@/components/games-provider";
import type { Game } from "@/lib/mock-games";

function toCompactGames(games: Game[]) {
  return games.map((game) => ({
    id: game.id,
    title: game.title,
    href: `/games/${game.id}`,
    meta: game.genre,
  }));
}

function ExpandedGameList({ games }: { games: Game[] }) {
  return (
    <ul className="space-y-2">
      {games.map((game) => (
        <li key={game.id}>
          <Link
            href={`/games/${game.id}`}
            className="group flex items-center justify-between gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2 transition-colors hover:border-zinc-700"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-200 group-hover:text-orange-400">
                {game.title}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                <CreatorLink name={game.creator} />
                <PlayTypeLabel playUrl={game.playUrl} />
              </div>
            </div>
            <span aria-hidden="true" className="shrink-0 text-zinc-600">
              →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function MyPagePlayerTab() {
  const {
    getSupportedGames,
    getWatchedGames,
    getBookmarkedGames,
    getPlayedGames,
  } = useGames();

  const supportedGames = getSupportedGames();
  const watchedGames = getWatchedGames();
  const bookmarkedGames = getBookmarkedGames();
  const playedGames = getPlayedGames();

  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpanded((current) => (current === id ? null : id));
  };

  const hasEngagementLists = useMemo(
    () =>
      supportedGames.length > 0 ||
      watchedGames.length > 0 ||
      bookmarkedGames.length > 0,
    [bookmarkedGames.length, supportedGames.length, watchedGames.length],
  );

  const hasPlayedProjects = playedGames.length > 0;

  return (
    <div className="space-y-8">
      <VoiceAdoptionsSection />
      <PlayHistorySection />

      {!hasEngagementLists && !hasPlayedProjects ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-16 text-center">
          <p className="text-zinc-400">まだ関わっている作品がありません。</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
          >
            作品を探す
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {watchedGames.length > 0 ? (
            <div className="lg:col-span-2">
              <MyPageUpdatesSection watchedGames={watchedGames} previewLimit={2} />
            </div>
          ) : null}

          <MyPageDashboardCard
            id="supported"
            title="応援中"
            description="気に入った作品への、あなたの応援です。"
            count={supportedGames.length}
            emptyMessage="応援した作品はまだありません。"
            accentClassName="border-orange-500"
            preview={
              <MyPageCompactGameList games={toCompactGames(supportedGames)} limit={2} />
            }
            expanded={<ExpandedGameList games={supportedGames} />}
            isExpanded={expanded === "supported"}
            onToggleExpand={() => toggle("supported")}
            showExpand={supportedGames.length > 2}
          />

          <MyPageDashboardCard
            id="watching"
            title="更新を追っている"
            description="開発ログが投稿されると、通知一覧でお知らせします。"
            count={watchedGames.length}
            emptyMessage="追跡中の作品はまだありません。"
            accentClassName="border-amber-500"
            preview={
              <MyPageCompactGameList games={toCompactGames(watchedGames)} limit={2} />
            }
            expanded={<ExpandedGameList games={watchedGames} />}
            isExpanded={expanded === "watching"}
            onToggleExpand={() => toggle("watching")}
            showExpand={watchedGames.length > 2}
          />

          <MyPageDashboardCard
            id="bookmarks"
            title="あとで見る"
            description="後からプレイしたい作品のブックマークです。"
            count={bookmarkedGames.length}
            emptyMessage="保存した作品はまだありません。"
            accentClassName="border-zinc-500"
            preview={
              <MyPageCompactGameList games={toCompactGames(bookmarkedGames)} limit={2} />
            }
            expanded={<ExpandedGameList games={bookmarkedGames} />}
            isExpanded={expanded === "bookmarks"}
            onToggleExpand={() => toggle("bookmarks")}
            showExpand={bookmarkedGames.length > 2}
          />
        </div>
      )}
    </div>
  );
}
