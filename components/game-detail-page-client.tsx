"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ForgeHeader } from "@/components/forge-header";
import { ForgeIdentityBlock } from "@/components/forge-identity-block";
import { GameCommunityVoicesSection } from "@/components/game-community-voices-section";
import { GameDescriptionSection } from "@/components/game-description-section";
import { GameDetailOverview } from "@/components/game-detail-overview";
import { GameDetailSidebar } from "@/components/game-detail-sidebar";
import { GameFeedbackForm } from "@/components/game-feedback";
import { GameProjectHistorySection } from "@/components/game-project-history-section";
import { useGames } from "@/components/games-provider";
import { hasUserSubmittedFeedback } from "@/lib/game-feedback-storage";
import { hasUserPlayedGame } from "@/lib/play-session";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function userCanSubmitFeedback(gameId: string): boolean {
  return hasUserPlayedGame(gameId) || hasUserSubmittedFeedback(gameId);
}

export function GameDetailPageClient({ id }: { id: string }) {
  const { user } = useAuth();
  const { getGameById, isSubmittedGame, isProjectOwner, dataReady } = useGames();
  const game = getGameById(id);
  const [canSubmitFeedback, setCanSubmitFeedback] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    setCanSubmitFeedback(userCanSubmitFeedback(id));
    setHasPlayed(hasUserPlayedGame(id));
  }, [id]);

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

                {canSubmitFeedback ? (
                  <GameFeedbackForm
                    gameId={game.id}
                    focusNotes={game.focusNotes}
                  />
                ) : hasPlayed ? null : (
                  <p className="mt-4 border-t border-zinc-800/80 pt-4 text-xs text-zinc-600">
                    プレイ後に、開発者向けのフィードバックを送れます。
                  </p>
                )}
              </div>

              <GameDetailSidebar
                game={game}
                userSubmitted={userSubmitted}
                canEdit={canEdit}
                formatDate={formatDate}
                onPlay={() => {
                  setHasPlayed(true);
                  setCanSubmitFeedback(true);
                }}
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
