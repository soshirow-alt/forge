"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { BookmarkButton } from "@/components/bookmark-button";
import { CreatorLink } from "@/components/creator-link";
import { ForgeHeader } from "@/components/forge-header";
import { ForgeIdentityBlock } from "@/components/forge-identity-block";
import { GameCommunityImpactSection } from "@/components/game-community-impact-section";
import { GameDevlogSection } from "@/components/game-devlog-section";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { GameExternalLinks } from "@/components/game-external-links";
import { PlayEnvironmentBadges } from "@/components/play-environment-badges";
import { PlaySafetyNote } from "@/components/play-safety-note";
import { getDistributionType } from "@/lib/play-environment";
import { TrustSafetyBadge } from "@/components/trust-safety-badge";
import { GameFeedback } from "@/components/game-feedback";
import { GameSupport } from "@/components/game-support";
import { GameTags } from "@/components/game-tags";
import { GameTesterApply } from "@/components/game-tester-apply";
import { GameThumbnail } from "@/components/game-thumbnail";
import { useGames } from "@/components/games-provider";
import { LABEL_TEST_PLAY_OPEN } from "@/lib/user-labels";

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
        <main className="mx-auto max-w-4xl px-6 py-12">
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

        <main className="mx-auto max-w-4xl px-6 py-12">
          <Link
            href="/"
            className="text-sm text-zinc-500 transition-colors hover:text-orange-400"
          >
            ← 作品一覧に戻る
          </Link>

          <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-16 text-center">
            <p className="text-zinc-400">この作品は非公開です</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <ForgeHeader />

      <main className="mx-auto max-w-4xl px-6 py-12">
        <Link
          href="/"
          className="text-sm text-zinc-500 transition-colors hover:text-orange-400"
        >
          ← 作品一覧に戻る
        </Link>

        <div className="mt-8 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80">
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

          <div className="p-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {game.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-zinc-500">{game.genre}</p>
              <ProjectStatusBadge game={game} />
              <TrustSafetyBadge game={game} />
            </div>
            <PlayEnvironmentBadges game={game} />
            <GameTags tags={game.tags} />

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="w-full sm:w-auto">
                <a
                  href={game.playUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 text-center text-lg font-semibold text-zinc-950 transition-opacity hover:opacity-90 sm:w-auto"
                >
                  プレイする
                </a>
                <PlaySafetyNote
                  playUrl={game.playUrl}
                  variant={
                    getDistributionType(game) === "download" ? "download" : "external"
                  }
                  className="mt-2 px-1"
                />
              </div>
              <BookmarkButton gameId={game.id} />
              {canEdit && (
                <Link
                  href={`/projects/${game.id}/edit`}
                  className="inline-block w-full rounded-lg border border-zinc-700 px-8 py-4 text-center text-lg font-semibold text-zinc-200 transition-colors hover:border-orange-500/50 hover:bg-zinc-900 sm:w-auto"
                >
                  編集する
                </Link>
              )}
            </div>

            <dl className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-zinc-500">作者</dt>
                <dd className="mt-1">
                  <CreatorLink
                    name={game.creator}
                    className="text-zinc-100 transition-colors hover:text-orange-400"
                  />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-zinc-500">
                  開発フェーズ
                </dt>
                <dd className="mt-1 text-zinc-100">{game.phase}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-zinc-500">
                  {LABEL_TEST_PLAY_OPEN}
                </dt>
                <dd className="mt-1">
                  <span
                    className={
                      game.lookingForTesters
                        ? "text-orange-400"
                        : "text-zinc-400"
                    }
                  >
                    {game.lookingForTesters ? "はい" : "いいえ"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-zinc-500">
                  最終更新
                </dt>
                <dd className="mt-1 text-zinc-100">
                  {formatDate(game.lastUpdated)}
                </dd>
              </div>
            </dl>

            <GameSupport
              gameId={game.id}
              isUserSubmitted={userSubmitted}
            />

            {game.lookingForTesters && game.testerSlots !== undefined && (
              <GameTesterApply
                gameId={game.id}
                testerSlots={game.testerSlots}
                isUserSubmitted={userSubmitted}
              />
            )}

            <div className="mt-8 border-t border-zinc-800 pt-8">
              <h2 className="text-sm font-medium text-zinc-500">説明</h2>
              <p className="mt-3 leading-relaxed text-zinc-300">
                {game.description}
              </p>
            </div>

            <div className="mt-8">
              <ForgeIdentityBlock />
            </div>

            <GameExternalLinks
              playUrl={game.playUrl}
              steamUrl={game.steamUrl}
              itchUrl={game.itchUrl}
              githubUrl={game.githubUrl}
              discordUrl={game.discordUrl}
              officialUrl={game.officialUrl}
              tags={game.tags}
            />

            <GameDevlogSection game={game} />

            <GameCommunityImpactSection projectId={game.id} />

            <GameFeedback gameId={game.id} />
          </div>
        </div>
      </main>
    </div>
  );
}
