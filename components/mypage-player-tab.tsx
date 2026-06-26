"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ForgeGameCardList,
  type ForgeGameCardBadge,
} from "@/components/forge-game-card";
import { MyPageUpdatesSection } from "@/components/mypage-updates-section";
import { OfficialReleaseSection } from "@/components/official-release-section";
import { PlayHistorySection } from "@/components/play-history-section";
import { VoiceAdoptionsSection } from "@/components/voice-adoptions-section";
import { MyPageDashboardCard } from "@/components/mypage-dashboard-card";
import { useGames } from "@/components/games-provider";
import type { Game } from "@/lib/mock-games";

function engagementBadge(id: string, label: string, emoji?: string): ForgeGameCardBadge[] {
  return [{ id, emoji, label }];
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

  const renderGameList = (
    games: Game[],
    badge: ForgeGameCardBadge[],
    limit?: number,
  ) => (
    <ForgeGameCardList
      games={games}
      variant="compact"
      limit={limit}
      badgesForGame={() => badge}
      detailLabel="詳細 →"
    />
  );

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
              <MyPageUpdatesSection
                watchedGames={watchedGames}
                playedGames={playedGames}
                previewLimit={2}
              />
            </div>
          ) : null}

          <MyPageDashboardCard
            id="supported"
            title="応援中"
            description="気に入った作品への、あなたの応援です。"
            count={supportedGames.length}
            emptyMessage="応援した作品はまだありません。"
            accentClassName="border-orange-500"
            preview={renderGameList(
              supportedGames,
              engagementBadge("supported", "応援中", "🧡"),
              2,
            )}
            expanded={renderGameList(
              supportedGames,
              engagementBadge("supported", "応援中", "🧡"),
            )}
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
            preview={renderGameList(
              watchedGames,
              engagementBadge("watching", "更新を追う", "🔄"),
              2,
            )}
            expanded={renderGameList(
              watchedGames,
              engagementBadge("watching", "更新を追う", "🔄"),
            )}
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
            preview={renderGameList(
              bookmarkedGames,
              engagementBadge("bookmark", "あとで見る", "🔖"),
              2,
            )}
            expanded={renderGameList(
              bookmarkedGames,
              engagementBadge("bookmark", "あとで見る", "🔖"),
            )}
            isExpanded={expanded === "bookmarks"}
            onToggleExpand={() => toggle("bookmarks")}
            showExpand={bookmarkedGames.length > 2}
          />
        </div>
      )}

      <OfficialReleaseSection />
    </div>
  );
}
