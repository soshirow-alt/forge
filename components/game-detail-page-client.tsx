"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { ForgeHeader } from "@/components/forge-header";
import { ForgeIdentityBlock } from "@/components/forge-identity-block";
import { GameDetailSidebar } from "@/components/game-detail-sidebar";
import { GameFeedback } from "@/components/game-feedback";
import { GameProjectHistorySection } from "@/components/game-project-history-section";
import { GameTags } from "@/components/game-tags";
import { GameThumbnail } from "@/components/game-thumbnail";
import { PlayEnvironmentBadges } from "@/components/play-environment-badges";
import { GameActivityBadges } from "@/components/game-activity-badges";
import { GameRecentActivitySection } from "@/components/game-recent-activity-section";
import { TrustSafetyBadge } from "@/components/trust-safety-badge";
import { useGames } from "@/components/games-provider";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function GameDetailPageClient({ id }: { id: string }) {
  const { user } = useAuth();
  const { getGameById, isSubmittedGame, isProjectOwner, dataReady } = useGames();
  const game = getGameById(id);

  if (!dataReady) {
    return (
      <div className="min-h-full bg-zinc-950 text-zinc-100">
        <ForgeHeader />
        <main className="mx-auto max-w-6xl px-6 py-8">
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

        <main className="mx-auto max-w-6xl px-6 py-8">
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

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Link
          href="/"
          className="text-sm text-zinc-500 transition-colors hover:text-orange-400"
        >
          ← 作品一覧に戻る
        </Link>

        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80">
          <GameThumbnail
            thumbnailUrl={game.thumbnailUrl}
            status={game.status}
            projectId={game.id}
            title={game.title}
            genre={game.genre}
            phase={game.phase}
            aspectClassName="aspect-[21/9]"
            statusClassName="absolute bottom-4 left-4 rounded-md bg-black/60 px-3 py-1.5 text-sm font-medium text-orange-400 backdrop-blur-sm"
            showStatus={Boolean(game.thumbnailUrl)}
            featured
          />

          <div className="p-5 sm:p-6 lg:p-8">
            <header>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {game.title}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <p className="text-sm text-zinc-500">{game.genre}</p>
                <TrustSafetyBadge game={game} />
              </div>
              <div className="mt-2">
                <GameActivityBadges game={game} />
              </div>
              <PlayEnvironmentBadges game={game} />
              <GameTags tags={game.tags} />
            </header>

            <div className="mt-5 lg:mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
              <section className="min-w-0">
                <h2 className="text-sm font-medium text-zinc-500">説明</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                  {game.description}
                </p>
                <div className="mt-4">
                  <ForgeIdentityBlock compact />
                </div>
              </section>

              <GameDetailSidebar
                game={game}
                userSubmitted={userSubmitted}
                canEdit={canEdit}
                formatDate={formatDate}
              />
            </div>

            <GameRecentActivitySection game={game} />

            <GameProjectHistorySection game={game} secondary />

            <GameFeedback gameId={game.id} deferred />
          </div>
        </div>
      </main>
    </div>
  );
}
