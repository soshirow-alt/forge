"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { CreatorLink } from "@/components/creator-link";
import { ForgeHeader } from "@/components/forge-header";
import { GameThumbnail } from "@/components/game-thumbnail";
import { useGames } from "@/components/games-provider";
import { getVisibilityBadgeLabel } from "@/lib/project-visibility";

export function MyProjectsPage() {
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const {
    getOwnedProjects,
    deleteSubmittedGame,
    getSupportCount,
    getApplicantCount,
  } = useGames();

  const ownedGames = getOwnedProjects(user?.id);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/login?redirect=/my-projects");
    }
  }, [hydrated, user, router]);

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

        <h1 className="mt-8 text-3xl font-bold tracking-tight">マイ作品</h1>
        <p className="mt-2 text-zinc-500">
          ログイン中のアカウントで投稿した作品を管理できます。
        </p>

        {hydrated && !user ? (
          <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-16 text-center">
            <p className="text-zinc-400">作品を管理するにはログインが必要です。</p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
            >
              ログイン
            </Link>
          </div>
        ) : ownedGames.length === 0 ? (
          <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-16 text-center">
            <p className="text-zinc-400">まだ投稿した作品がありません。</p>
            <Link
              href="/submit"
              className="mt-6 inline-block rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
            >
              作品を投稿する
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ownedGames.map((game) => (
              <article
                key={game.id}
                className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80"
              >
                <GameThumbnail
                  thumbnailUrl={game.thumbnailUrl}
                  status={game.status}
                />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold text-zinc-100">
                      {game.title}
                    </h2>
                    <span
                      className={
                        game.visibility === "private"
                          ? "shrink-0 rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-400"
                          : "shrink-0 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-400"
                      }
                    >
                      {getVisibilityBadgeLabel(game.visibility)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">
                    作者: <CreatorLink name={game.creator} />
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">{game.genre}</p>
                  <p className="mt-2 text-sm text-zinc-400">
                    開発フェーズ: {game.phase}
                  </p>
                  <p className="mt-2 text-sm text-orange-400">
                    ❤ {getSupportCount(game.id, 0)}人が応援中
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    テスター募集:{" "}
                    {game.lookingForTesters ? "募集中" : "なし"}
                  </p>
                  {game.lookingForTesters && game.testerSlots !== undefined && (
                    <p className="mt-1 text-sm text-zinc-400">
                      応募者数: {getApplicantCount(game.id, 0)} /{" "}
                      {game.testerSlots}人
                    </p>
                  )}
                  <div className="mt-4 flex gap-3">
                    <Link
                      href={`/projects/${game.id}/edit`}
                      className="flex-1 rounded-lg border border-zinc-700 px-4 py-2 text-center text-sm font-medium text-zinc-200 transition-colors hover:border-orange-500/50 hover:bg-zinc-900"
                    >
                      編集
                    </Link>
                    <button
                      type="button"
                      onClick={() => deleteSubmittedGame(game.id)}
                      className="flex-1 rounded-lg border border-red-900/50 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:border-red-500/50 hover:bg-red-950/30"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
