"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { AuthGatedHint } from "@/components/auth-gated-hint";
import { ForgeHeader } from "@/components/forge-header";
import { ForgeIdentityBlock } from "@/components/forge-identity-block";
import { GameCommunityVoicesSection } from "@/components/game-community-voices-section";
import { GameDescriptionSection } from "@/components/game-description-section";
import { GameDetailOverview } from "@/components/game-detail-overview";
import { GameDetailSidebar } from "@/components/game-detail-sidebar";
import { GameFeedbackForm } from "@/components/game-feedback";
import { GameProjectHistorySection } from "@/components/game-project-history-section";
import { useGames } from "@/components/games-provider";
import { useRequireAuth } from "@/hooks/use-require-auth";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function GameDetailPageClient({ id }: { id: string }) {
  const { user } = useAuth();
  const { getGameById, isSubmittedGame, isProjectOwner, dataReady, hasPlayedGame } =
    useGames();
  const { isLoggedIn, goToLogin } = useRequireAuth();
  const game = getGameById(id);
  const [played, setPlayed] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      setPlayed(hasPlayedGame(id));
    } else {
      setPlayed(false);
    }
  }, [id, isLoggedIn, hasPlayedGame]);

  if (!dataReady) {
    return (
      <div className="min-h-full bg-zinc-950 text-zinc-100">
        <ForgeHeader />
        <main className="mx-auto max-w-7xl px-6 py-8">
          <p className="text-zinc-500">読み込み中...</p>
        </main>
      </div>
    );
  }

  if (!game) {
    notFound();
  }

  const userSubmitted = isSubmittedGame(game.id);
  const canEdit = isProjectOwner(game.id, user?.id);
  const isPrivate = userSubmitted && game.visibility === "private";

  if (isPrivate && !canEdit) {
    return (
      <div className="min-h-full bg-zinc-950 text-zinc-100">
        <ForgeHeader />

        <main className="mx-auto max-w-7xl px-6 py-8">
          <Link
            href="/"
            className="text-sm text-zinc-500 transition-colors hover:text-orange-400"
          >
            ← 作品一覧に戻る
          </Link>

          <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-12 text-center">
            <p className="text-zinc-400">この作品は非公開です</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <ForgeHeader />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Link
          href="/"
          className="text-sm text-zinc-500 transition-colors hover:text-orange-400"
        >
          ← 作品一覧に戻る
        </Link>

        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80">
          <div className="p-5 sm:p-6 lg:p-7">
            <header className="border-b border-zinc-800/60 pb-4">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {game.title}
              </h1>
              <p className="mt-1 text-sm text-zinc-500">{game.creator}</p>
            </header>

            <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_232px] lg:items-start lg:gap-5 xl:grid-cols-[minmax(0,1.15fr)_248px] xl:gap-6">
              <div className="min-w-0">
                <GameDetailOverview game={game} />

                <GameDescriptionSection description={game.description} />

                <GameCommunityVoicesSection gameId={game.id} />

                <GameProjectHistorySection game={game} />

                {isLoggedIn && played ? (
                  <GameFeedbackForm
                    gameId={game.id}
                    focusNotes={game.focusNotes}
                  />
                ) : (
                  <div className="mt-4 border-t border-zinc-800/80 pt-4">
                    {!isLoggedIn ? (
                      <>
                        <button
                          type="button"
                          onClick={goToLogin}
                          title="ログインすると使えます"
                          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-orange-500/40 hover:text-orange-400"
                        >
                          ログインしてフィードバック
                        </button>
                        <AuthGatedHint
                          hint="プレイ後にフィードバックを送れます"
                          className="mt-2"
                        />
                      </>
                    ) : (
                      <p className="text-xs text-zinc-600">
                        プレイ後に、開発者向けのフィードバックを送れます。
                      </p>
                    )}
                  </div>
                )}
              </div>

              <GameDetailSidebar
                game={game}
                userSubmitted={userSubmitted}
                canEdit={canEdit}
                formatDate={formatDate}
                onPlay={() => setPlayed(true)}
              />
            </div>

            <div className="mt-4 border-t border-zinc-800/60 pt-3">
              <ForgeIdentityBlock compact />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
