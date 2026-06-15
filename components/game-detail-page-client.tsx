"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { AuthGatedHint } from "@/components/auth-gated-hint";
import { ForgeHeader } from "@/components/forge-header";
import { ForgeIdentityBlock } from "@/components/forge-identity-block";
import { EveryonesVoiceSection } from "@/components/everyones-voice-section";
import { GameDescriptionSection } from "@/components/game-description-section";
import { GameDetailOverview } from "@/components/game-detail-overview";
import { GameDetailSidebar } from "@/components/game-detail-sidebar";
import {
  GameVoiceSection,
  type GameVoiceFlowMeta,
} from "@/components/game-voice-section";
import { GameProjectHistorySection } from "@/components/game-project-history-section";
import { NewPlayableVersionBanner } from "@/components/new-playable-version-banner";
import { PlayLaunchDialog } from "@/components/play-launch-dialog";
import {
  PostPlayVoiceOverlay,
  type VoiceOverlayMode,
} from "@/components/post-play-voice-overlay";
import { useGames } from "@/components/games-provider";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { gameDetailReturnPath } from "@/lib/login-return-url";
import {
  derivePlayerVoiceFlowState,
  getFirstPromptPreview,
} from "@/lib/player-voice-flow-state";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const INITIAL_VOICE_FLOW_META: GameVoiceFlowMeta = {
  voiceComplete: false,
  prompts: [],
  loading: false,
};

function overlayDismissKey(gameId: string) {
  return `forge-voice-overlay-dismissed-${gameId}`;
}

function readOverlayDismissed(gameId: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return sessionStorage.getItem(overlayDismissKey(gameId)) === "1";
}

function writeOverlayDismissed(gameId: string) {
  sessionStorage.setItem(overlayDismissKey(gameId), "1");
}

export function GameDetailPageClient({ id }: { id: string }) {
  const { user } = useAuth();
  const {
    getGameById,
    isSubmittedGame,
    isProjectOwner,
    dataReady,
    hasPlayedGame,
    recordPlay,
  } = useGames();
  const { isLoggedIn, goToLogin } = useRequireAuth();
  const game = getGameById(id);
  const [played, setPlayed] = useState(false);
  const [playDialogOpen, setPlayDialogOpen] = useState(false);
  const [launchingGame, setLaunchingGame] = useState(false);
  const [voiceFlowMeta, setVoiceFlowMeta] =
    useState<GameVoiceFlowMeta>(INITIAL_VOICE_FLOW_META);
  const [overlayMode, setOverlayMode] = useState<VoiceOverlayMode>("hidden");
  const [overlayDismissed, setOverlayDismissed] = useState(false);
  const [voiceDataReady, setVoiceDataReady] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      setPlayed(hasPlayedGame(id));
    } else {
      setPlayed(false);
    }
    setOverlayDismissed(readOverlayDismissed(id));
  }, [id, isLoggedIn, hasPlayedGame]);

  useEffect(() => {
    if (!isLoggedIn || !played) {
      setVoiceFlowMeta(INITIAL_VOICE_FLOW_META);
      setOverlayMode("hidden");
      setVoiceDataReady(false);
    }
  }, [id, isLoggedIn, played]);

  const voiceFlowState = derivePlayerVoiceFlowState({
    isLoggedIn,
    played,
    voiceComplete: voiceFlowMeta.voiceComplete,
  });

  const firstPromptPreview = useMemo(
    () => getFirstPromptPreview(voiceFlowMeta.prompts),
    [voiceFlowMeta.prompts],
  );

  useEffect(() => {
    if (
      voiceFlowState === "played_pending" &&
      voiceDataReady &&
      !overlayDismissed &&
      !voiceFlowMeta.loading &&
      overlayMode === "hidden"
    ) {
      setOverlayMode("prompt");
    }
  }, [
    voiceFlowState,
    voiceDataReady,
    overlayDismissed,
    voiceFlowMeta.loading,
    overlayMode,
  ]);

  const handlePlayRequest = useCallback(() => {
    if (!isLoggedIn) {
      goToLogin(gameDetailReturnPath(id));
      return;
    }

    setPlayDialogOpen(true);
  }, [goToLogin, id, isLoggedIn]);

  const handleLaunchGame = useCallback(async () => {
    if (!game || !isLoggedIn) {
      return;
    }

    setLaunchingGame(true);
    try {
      await recordPlay(game.id);
      setPlayed(true);
      setOverlayDismissed(false);
      sessionStorage.removeItem(overlayDismissKey(game.id));
      window.open(game.playUrl, "_blank", "noopener,noreferrer");
      setPlayDialogOpen(false);
    } finally {
      setLaunchingGame(false);
    }
  }, [game, isLoggedIn, recordPlay]);

  const handleOverlayDismiss = useCallback(() => {
    writeOverlayDismissed(id);
    setOverlayDismissed(true);
    setOverlayMode("hidden");
  }, [id]);

  const handleOpenVoiceForm = useCallback(() => {
    setOverlayMode("form");
  }, []);

  const handleSidebarVoiceRequest = useCallback(() => {
    setOverlayMode("form");
  }, []);

  const handleVoiceFlowStateChange = useCallback((meta: GameVoiceFlowMeta) => {
    setVoiceFlowMeta(meta);
    if (!meta.loading) {
      setVoiceDataReady(true);
    }
  }, []);

  const handleVoiceComplete = useCallback(() => {
    writeOverlayDismissed(id);
    setOverlayDismissed(true);
    setOverlayMode("hidden");
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

      <PlayLaunchDialog
        open={playDialogOpen}
        onClose={() => setPlayDialogOpen(false)}
        onLaunch={() => {
          void handleLaunchGame();
        }}
        launching={launchingGame}
      />

      {isLoggedIn && played && !voiceDataReady && (
        <div className="hidden" aria-hidden>
          <GameVoiceSection
            gameId={id}
            embedded
            showDeepFeedback={false}
            onFlowStateChange={handleVoiceFlowStateChange}
          />
        </div>
      )}

      {isLoggedIn &&
        played &&
        voiceDataReady &&
        voiceFlowState !== "voice_complete" && (
          <PostPlayVoiceOverlay
            mode={overlayMode}
            firstPromptPreview={firstPromptPreview}
            onDismiss={handleOverlayDismiss}
            onOpenForm={handleOpenVoiceForm}
          >
            <GameVoiceSection
              gameId={id}
              embedded
              showDeepFeedback={false}
              onFlowStateChange={handleVoiceFlowStateChange}
              onVoiceComplete={handleVoiceComplete}
            />
          </PostPlayVoiceOverlay>
        )}

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

                <NewPlayableVersionBanner game={game} />

                <GameDescriptionSection description={game.description} />

                <EveryonesVoiceSection
                  gameId={game.id}
                  playableVersion={game.playableVersion}
                />

                <GameProjectHistorySection game={game} />

                {voiceFlowState === "voice_complete" && voiceDataReady && (
                  <GameVoiceSection
                    gameId={id}
                    onFlowStateChange={handleVoiceFlowStateChange}
                    showDeepFeedback
                  />
                )}

                {voiceFlowState === "not_played" && (
                  <div className="mt-4 border-t border-zinc-800/80 pt-4">
                    {!isLoggedIn ? (
                      <>
                        <button
                          type="button"
                          onClick={() => goToLogin()}
                          title="ログインすると使えます"
                          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-orange-500/40 hover:text-orange-400"
                        >
                          ログインして声を届ける
                        </button>
                        <AuthGatedHint
                          hint="プレイ後に開発者の問いへ声を送れます"
                          className="mt-2"
                        />
                      </>
                    ) : (
                      <p className="text-xs text-zinc-600">
                        プレイ後に、開発者の問いへ声を届けられます。
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
                isLoggedIn={isLoggedIn}
                voiceFlowState={voiceFlowState}
                onPlayRequest={handlePlayRequest}
                onVoiceRequest={handleSidebarVoiceRequest}
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
