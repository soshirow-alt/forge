"use client";

import Link from "next/link";
import { CreatorLink } from "@/components/creator-link";
import { DevelopmentActivityPanel } from "@/components/development-activity-panel";
import { AuthGatedHint } from "@/components/auth-gated-hint";
import { GameExternalLinks } from "@/components/game-external-links";
import { GameSupport } from "@/components/game-support";
import { GameTesterApply } from "@/components/game-tester-apply";
import { GameThumbnail } from "@/components/game-thumbnail";
import { GameWatchButton } from "@/components/game-watch-button";
import { BookmarkButton } from "@/components/bookmark-button";
import { PlaySafetyNote } from "@/components/play-safety-note";
import { useGames } from "@/components/games-provider";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { gameDetailReturnPath } from "@/lib/login-return-url";
import { displayPhase } from "@/lib/development-phases";
import type { MouseEvent } from "react";
import { getDistributionType } from "@/lib/play-environment";
import type { Game } from "@/lib/mock-games";

type GameDetailSidebarProps = {
  game: Game;
  userSubmitted: boolean;
  canEdit: boolean;
  formatDate: (date: string) => string;
  onPlay?: () => void;
};

export function GameDetailSidebar({
  game,
  userSubmitted,
  canEdit,
  formatDate,
  onPlay,
}: GameDetailSidebarProps) {
  const { recordPlay } = useGames();
  const { isLoggedIn, requireAuth } = useRequireAuth();

  function handlePlayClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!isLoggedIn) {
      event.preventDefault();
      requireAuth(() => undefined, gameDetailReturnPath(game.id));
      return;
    }

    void recordPlay(game.id).then(() => {
      onPlay?.();
    });
  }

  return (
    <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
      <GameThumbnail
        thumbnailUrl={game.thumbnailUrl}
        status={game.status}
        projectId={game.id}
        title={game.title}
        genre={game.genre}
        phase={displayPhase(game.phase)}
        aspectClassName="aspect-video rounded-xl overflow-hidden border border-zinc-800"
        showStatus={Boolean(game.thumbnailUrl)}
      />

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5">
        <a
          href={isLoggedIn ? game.playUrl : LOGIN_FALLBACK}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handlePlayClick}
          title={isLoggedIn ? undefined : "ログインすると使えます"}
          className="block w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-center text-base font-semibold text-zinc-950 transition-opacity hover:opacity-90"
        >
          {isLoggedIn ? "プレイする" : "ログインしてプレイ"}
        </a>
        {!isLoggedIn && (
          <AuthGatedHint
            hint="プレイ後にフィードバックを送れます"
            className="mt-2 px-0.5"
          />
        )}
        <PlaySafetyNote
          playUrl={game.playUrl}
          variant={
            getDistributionType(game) === "download" ? "download" : "external"
          }
          className="mt-2 px-0.5 text-xs"
        />

        <div className="mt-2.5 flex flex-col gap-2">
          <GameWatchButton gameId={game.id} compact className="w-full" />
          <BookmarkButton gameId={game.id} compact className="w-full" />
          {canEdit && (
            <Link
              href={`/projects/${game.id}/edit`}
              className="block w-full rounded-lg border border-zinc-700 px-4 py-2 text-center text-sm font-semibold text-zinc-200 transition-colors hover:border-orange-500/50 hover:bg-zinc-900"
            >
              編集する
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-3.5">
        <GameSupport gameId={game.id} isUserSubmitted={userSubmitted} compact />

        {game.lookingForTesters && game.testerSlots !== undefined && (
          <GameTesterApply
            gameId={game.id}
            testerSlots={game.testerSlots}
            isUserSubmitted={userSubmitted}
            compact
          />
        )}

        <DevelopmentActivityPanel gameId={game.id} />

        <dl className="grid gap-2.5 border-t border-zinc-800 pt-3.5 text-sm">
          {game.estimatedPlayTime && (
            <div>
              <dt className="text-xs text-zinc-500">想定プレイ時間</dt>
              <dd className="mt-0.5 font-medium text-zinc-100">
                {game.estimatedPlayTime}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-zinc-500">最終更新</dt>
            <dd className="mt-0.5 text-zinc-100">
              {formatDate(game.lastUpdated)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">作者</dt>
            <dd className="mt-0.5">
              <CreatorLink
                name={game.creator}
                className="text-zinc-100 transition-colors hover:text-orange-400"
              />
            </dd>
          </div>
        </dl>

        <GameExternalLinks
          gameId={game.id}
          playUrl={game.playUrl}
          steamUrl={game.steamUrl}
          itchUrl={game.itchUrl}
          githubUrl={game.githubUrl}
          discordUrl={game.discordUrl}
          officialUrl={game.officialUrl}
          tags={game.tags}
          compact
        />
      </div>
    </aside>
  );
}

const LOGIN_FALLBACK = "#";
