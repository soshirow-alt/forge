"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { BookmarkButton } from "@/components/bookmark-button";
import { CreatorLink } from "@/components/creator-link";
import { DiscoveryCardStatPills } from "@/components/discovery-card-stat-pills";
import { ForgeHeader } from "@/components/forge-header";
import { GameTags } from "@/components/game-tags";
import { PlayTypeLabel } from "@/components/play-type-label";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import { useGames } from "@/components/games-provider";
import { useRedirectToLoginWhenLoggedOut } from "@/hooks/use-redirect-to-login-when-logged-out";
import { displayPhase } from "@/lib/development-phases";

export function BookmarksPage() {
  const { user, hydrated } = useAuth();
  const { getBookmarkedGames, getPublicProjectStats, publicCatalogReady } =
    useGames();

  useRedirectToLoginWhenLoggedOut();

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
          className="text-sm text-zinc-500 transition-colors hover:text-violet-400"
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
            {games.map((game) => {
              const stats = getPublicProjectStats(game.id);
              return (
                <article
                  key={game.id}
                  className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80"
                >
                  <Link href={`/games/${game.id}`} className="group block">
                    <ProjectThumbnail
                      projectId={game.id}
                      title={game.title}
                      genre={game.genre}
                      version={displayPhase(game.phase)}
                      variant="card"
                      className="rounded-none"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="p-4">
                      <h2 className="font-semibold text-zinc-100 transition-colors group-hover:text-violet-300">
                        {game.title}
                      </h2>
                      <p className="mt-1 text-sm text-zinc-500">{game.genre}</p>
                      <div className="mt-2">
                        <PlayTypeLabel playUrl={game.playUrl} />
                      </div>
                      <div className="mt-2">
                        <DiscoveryCardStatPills
                          playCount={
                            publicCatalogReady ? stats.playPlayerCount : null
                          }
                          feedbackCount={stats.feedbackParticipantCount}
                          watchCount={stats.watchCount}
                          loaded={publicCatalogReady}
                          compact
                        />
                      </div>
                      <GameTags tags={game.tags} />
                    </div>
                  </Link>
                  <div className="flex items-center justify-between border-t border-zinc-800/80 px-4 py-3">
                    <CreatorLink name={game.creator} />
                    <BookmarkButton gameId={game.id} compact />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
