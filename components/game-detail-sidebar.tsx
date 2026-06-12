"use client";

import Link from "next/link";
import { BookmarkButton } from "@/components/bookmark-button";
import { CreatorLink } from "@/components/creator-link";
import { GameExternalLinks } from "@/components/game-external-links";
import { GameSupport } from "@/components/game-support";
import { GameTesterApply } from "@/components/game-tester-apply";
import { PlaySafetyNote } from "@/components/play-safety-note";
import { getDistributionType } from "@/lib/play-environment";
import { LABEL_TEST_PLAY_OPEN } from "@/lib/user-labels";
import type { Game } from "@/lib/mock-games";

type GameDetailSidebarProps = {
  game: Game;
  userSubmitted: boolean;
  canEdit: boolean;
  formatDate: (date: string) => string;
};

export function GameDetailSidebar({
  game,
  userSubmitted,
  canEdit,
  formatDate,
}: GameDetailSidebarProps) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
        <a
          href={game.playUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-center text-base font-semibold text-zinc-950 transition-opacity hover:opacity-90"
        >
          プレイする
        </a>
        <PlaySafetyNote
          playUrl={game.playUrl}
          variant={
            getDistributionType(game) === "download" ? "download" : "external"
          }
          className="mt-2 px-0.5 text-xs"
        />

        <div className="mt-3 flex flex-col gap-2">
          <BookmarkButton gameId={game.id} compact className="w-full" />
          {canEdit && (
            <Link
              href={`/projects/${game.id}/edit`}
              className="block w-full rounded-lg border border-zinc-700 px-4 py-2.5 text-center text-sm font-semibold text-zinc-200 transition-colors hover:border-orange-500/50 hover:bg-zinc-900"
            >
              編集する
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-4">
        <GameSupport gameId={game.id} isUserSubmitted={userSubmitted} compact />

        {game.lookingForTesters && game.testerSlots !== undefined && (
          <GameTesterApply
            gameId={game.id}
            testerSlots={game.testerSlots}
            isUserSubmitted={userSubmitted}
            compact
          />
        )}

        <dl className="grid gap-3 border-t border-zinc-800 pt-4 text-sm">
          <div>
            <dt className="text-xs text-zinc-500">開発フェーズ</dt>
            <dd className="mt-0.5 font-medium text-zinc-100">{game.phase}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">最終更新</dt>
            <dd className="mt-0.5 text-zinc-100">
              {formatDate(game.lastUpdated)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">{LABEL_TEST_PLAY_OPEN}</dt>
            <dd className="mt-0.5">
              <span
                className={
                  game.lookingForTesters ? "text-orange-400" : "text-zinc-400"
                }
              >
                {game.lookingForTesters ? "受付中" : "—"}
              </span>
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
