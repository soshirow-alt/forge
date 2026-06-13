"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { BookmarkButton } from "@/components/bookmark-button";
import { CreatorLink } from "@/components/creator-link";
import { ForgeHeader } from "@/components/forge-header";
import { GameTags } from "@/components/game-tags";
import { GameThumbnail } from "@/components/game-thumbnail";
import { PlayTypeLabel } from "@/components/play-type-label";
import { useGames } from "@/components/games-provider";
import { LOGIN_PATH } from "@/hooks/use-require-auth";

export function BookmarksPage() {
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const { getBookmarkedGames } = useGames();

  useEffect(() => {
    if (hydrated && !user) {
      router.replace(LOGIN_PATH);
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="min-h-full bg-zinc-950 text-zinc-100">
        <ForgeHeader />
        <main className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-zinc-500">読み込み中...</p>
        </main>
      </div>
    );
  }

  const games = getBookmarkedGames();

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <ForgeHeader />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <Link
          href="/"
          className="text-sm text-zinc-500 transition-colors hover:text-orange-400"
        >
          ← 作品一覧に戻る
        </Link>

        <h1 className="mt-8 text-3xl font-bold tracking-tight">あとで遊ぶ</h1>
        <p className="mt-2 text-zinc-500">保存した作品をここから確認できます。</p>

        {games.length === 0 ? (
          <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-16 text-center">
            <p className="text-zinc-400">保存した作品はまだありません</p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <article
                key={game.id}
                className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80"
              >
                <Link href={`/games/${game.id}`} className="group block">
                  <GameThumbnail
                    thumbnailUrl={game.thumbnailUrl}
                    status={game.status}
                    projectId={game.id}
                    title={game.title}
                    genre={game.genre}
                    phase={game.phase}
                  />
                  <div className="p-4">
                    <h2 className="font-semibold text-zinc-100 transition-colors group-hover:text-orange-400">
                      {game.title}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">{game.genre}</p>
                    <div className="mt-2">
                      <PlayTypeLabel playUrl={game.playUrl} />
                    </div>
                    <GameTags tags={game.tags} />
                  </div>
                </Link>
                <div className="flex items-center justify-between border-t border-zinc-800/80 px-4 py-3">
                  <CreatorLink name={game.creator} />
                  <BookmarkButton gameId={game.id} compact />
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
