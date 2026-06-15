"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CreatorLink } from "@/components/creator-link";
import {
  MyPageCompactGameList,
  MyPageDashboardCard,
} from "@/components/mypage-dashboard-card";
import { MyPageUpdatesSection } from "@/components/mypage-updates-section";
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

  const hasAnyActivity = useMemo(
    () =>
      supportedGames.length > 0 ||
      watchedGames.length > 0 ||
      bookmarkedGames.length > 0 ||
      playedGames.length > 0,
    [
      bookmarkedGames.length,
      playedGames.length,
      supportedGames.length,
      watchedGames.length,
    ],
  );

  if (!hasAnyActivity) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-16 text-center">
        <p className="text-zinc-400">まだ関わっている作品がありません。</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
        >
          作品を探す
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section
        aria-label="用語の説明"
        className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5"
      >
        <h2 className="text-sm font-semibold text-zinc-200">
          3つのリストの違い
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium text-orange-400">応援中</dt>
            <dd className="mt-1 text-xs leading-relaxed text-zinc-500">
              気に入った作品への応援（投げ銭ではありません）。開発者への励ましとして残ります。
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-amber-400">
              更新を追っている
            </dt>
            <dd className="mt-1 text-xs leading-relaxed text-zinc-500">
              開発ログや新版公開の通知を受け取りたい作品のリストです。
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-emerald-400">更新を見る</dt>
            <dd className="mt-1 text-xs leading-relaxed text-zinc-500">
              追跡中作品の devlog / 新版の変更要点をまとめて確認する場所です。
            </dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <MyPageUpdatesSection watchedGames={watchedGames} previewLimit={2} />
        </div>

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

        <MyPageDashboardCard
          id="played"
          title="最近プレイした"
          description="プレイした作品の履歴です（回答した作品もここに含まれます）。"
          count={playedGames.length}
          emptyMessage="まだプレイ履歴がありません。"
          accentClassName="border-sky-500"
          preview={
            <MyPageCompactGameList games={toCompactGames(playedGames)} limit={2} />
          }
          expanded={<ExpandedGameList games={playedGames} />}
          isExpanded={expanded === "played"}
          onToggleExpand={() => toggle("played")}
          showExpand={playedGames.length > 2}
        />
      </div>
    </div>
  );
}
