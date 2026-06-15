"use client";

import Link from "next/link";
import { CreatorLink } from "@/components/creator-link";
import { DevelopmentActivityPanel } from "@/components/development-activity-panel";
import { AuthGatedHint } from "@/components/auth-gated-hint";
import { GameExternalLinks } from "@/components/game-external-links";
import { GameSupport } from "@/components/game-support";
import { GameThumbnail } from "@/components/game-thumbnail";
import { GameWatchButton } from "@/components/game-watch-button";
import { BookmarkButton } from "@/components/bookmark-button";
import { PlaySafetyNote } from "@/components/play-safety-note";
import { displayPhase } from "@/lib/development-phases";
import { projectStudioPath } from "@/lib/project-nurture-links";
import { scrollToGameDeepFeedbackEntry } from "@/lib/game-feedback-ui";
import { getDistributionType } from "@/lib/play-environment";
import type { PlayerVoiceFlowState } from "@/lib/player-voice-flow-state";
import type { Game } from "@/lib/mock-games";

type GameDetailSidebarProps = {
  game: Game;
  userSubmitted: boolean;
  isOwnerPreview: boolean;
  formatDate: (date: string) => string;
  isLoggedIn: boolean;
  voiceFlowState: PlayerVoiceFlowState;
  onPlayRequest: () => void;
  onVoiceRequest: () => void;
};

export function GameDetailSidebar({
  game,
  userSubmitted,
  isOwnerPreview,
  formatDate,
  isLoggedIn,
  voiceFlowState,
  onPlayRequest,
  onVoiceRequest,
}: GameDetailSidebarProps) {
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

      {isOwnerPreview ? (
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3.5">
          <p className="text-[11px] font-medium text-orange-300/90">
            プレイヤー向けページのプレビュー
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
            公開中の見え方を確認しています。回答の送信やプレイヤー向け操作は、別アカウントで確認してください。
          </p>
          <Link
            href={projectStudioPath(game.id)}
            className="mt-3 block w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-4 py-2.5 text-center text-sm font-semibold text-zinc-100 transition-colors hover:border-orange-500/50 hover:bg-zinc-900"
          >
            この作品を育てる
          </Link>
          <button
            type="button"
            onClick={onPlayRequest}
            className="mt-3 w-full rounded-lg px-4 py-2 text-center text-xs font-medium text-zinc-500 transition-colors hover:text-orange-400/90"
          >
            テストプレイ（任意）
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5">
          {voiceFlowState === "played_pending" ? (
            <>
              <button
                type="button"
                onClick={onVoiceRequest}
                className="block w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-center text-base font-semibold text-zinc-950 transition-opacity hover:opacity-90"
              >
                質問に答える
              </button>
              <p className="mt-2 text-[11px] text-zinc-600">1つ答えるだけでOK</p>
              <button
                type="button"
                onClick={onPlayRequest}
                className="mt-3 w-full text-center text-xs font-medium text-zinc-500 transition-colors hover:text-orange-400/90"
              >
                もう一度プレイする
              </button>
            </>
          ) : voiceFlowState === "voice_complete" ? (
            <>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-center text-sm font-medium text-zinc-500">
                回答を送信しました ✓
              </div>
              <button
                type="button"
                onClick={onPlayRequest}
                className="mt-2 w-full text-center text-xs font-medium text-zinc-500 transition-colors hover:text-orange-400/90"
              >
                もう一度プレイする
              </button>
              <button
                type="button"
                onClick={scrollToGameDeepFeedbackEntry}
                className="mt-2 w-full text-center text-xs font-medium text-zinc-500 transition-colors hover:text-orange-400/90"
              >
                詳しい感想を書く（任意）
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onPlayRequest}
              title={isLoggedIn ? undefined : "ログインすると使えます"}
              className="block w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-center text-base font-semibold text-zinc-950 transition-opacity hover:opacity-90"
            >
              {isLoggedIn ? "プレイする" : "ログインしてプレイ"}
            </button>
          )}
          {!isLoggedIn && (
            <AuthGatedHint
              hint="プレイ後に質問へ回答できます"
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
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-3.5">
        {!isOwnerPreview && (
          <GameSupport gameId={game.id} isUserSubmitted={userSubmitted} compact />
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
