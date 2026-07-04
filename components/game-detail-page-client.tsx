"use client";

import Link from "next/link";
import { notFound, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { AuthGatedHint } from "@/components/auth-gated-hint";
import { AdoptionVerifyBanner } from "@/components/adoption-verify-banner";
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
import { GameChangeCheckSection } from "@/components/game-change-check-section";
import { NewPlayableVersionBanner } from "@/components/new-playable-version-banner";
import { VoiceAdoptionsSection } from "@/components/voice-adoptions-section";
import { PlayLaunchDialog } from "@/components/play-launch-dialog";
import {
  PostPlayVoiceOverlay,
  type VoiceOverlayMode,
} from "@/components/post-play-voice-overlay";
import { useGames } from "@/components/games-provider";
import { useAdoptionVerifyContext } from "@/hooks/use-adoption-verify-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { parseAdoptionQueryParam } from "@/lib/adoption-verify-context";
import { gameDetailReturnPath } from "@/lib/login-return-url";
import { ADOPTION_VERIFY_SECTION_ID } from "@/lib/project-nurture-links";
import { isVoiceAdoptionPlayerVisible } from "@/lib/voice-adoption/constants";
import {
  derivePlayerVoiceFlowState,
  getFirstPromptPreview,
  type PlayerVoiceFlowState,
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
  const searchParams = useSearchParams();
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
  const voiceCompleteKnownRef = useRef(false);

  const adoptionPlayerVisible = isVoiceAdoptionPlayerVisible();
  const adoptionQueryId = useMemo(
    () => parseAdoptionQueryParam(searchParams.get("adoption")),
    [searchParams],
  );
  const { context: adoptionVerifyContext, loaded: adoptionVerifyLoaded } =
    useAdoptionVerifyContext(id, adoptionQueryId);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !adoptionPlayerVisible ||
      !adoptionVerifyContext
    ) {
      return;
    }

    if (window.location.hash === `#${ADOPTION_VERIFY_SECTION_ID}`) {
      const element = document.getElementById(ADOPTION_VERIFY_SECTION_ID);
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [adoptionPlayerVisible, adoptionVerifyContext, adoptionVerifyLoaded]);

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
      voiceCompleteKnownRef.current = false;
    }
  }, [id, isLoggedIn, played]);

  const handleVoiceFlowStateChange = useCallback((meta: GameVoiceFlowMeta) => {
    if (meta.loading) {
      return;
    }

    if (meta.voiceComplete) {
      voiceCompleteKnownRef.current = true;
    }

    setVoiceFlowMeta((prev) => ({
      ...meta,
      voiceComplete: meta.voiceComplete || voiceCompleteKnownRef.current,
    }));
    setVoiceDataReady(true);
  }, []);

  const voiceFlowState = useMemo((): PlayerVoiceFlowState => {
    if (!isLoggedIn || !played) {
      return "not_played";
    }

    if (!voiceDataReady) {
      return voiceCompleteKnownRef.current ? "voice_complete" : "played_pending";
    }

    return derivePlayerVoiceFlowState({
      isLoggedIn,
      played,
      voiceComplete:
        voiceFlowMeta.voiceComplete || voiceCompleteKnownRef.current,
    });
  }, [isLoggedIn, played, voiceDataReady, voiceFlowMeta.voiceComplete]);

  const firstPromptPreview = useMemo(
    () => getFirstPromptPreview(voiceFlowMeta.prompts),
    [voiceFlowMeta.prompts],
  );

  useEffect(() => {
    if (
      voiceFlowState === "played_pending" &&
      voiceDataReady &&
      !overlayDismissed &&
      overlayMode === "hidden"
    ) {
      setOverlayMode("prompt");
    }
  }, [voiceFlowState, voiceDataReady, overlayDismissed, overlayMode]);

  const handlePlayRequest = useCallback(() => {
    if (!isLoggedIn) {
      goToLogin(gameDetailReturnPath(id));
      return;
    }

    setPlayDialogOpen(true);
  }, [goToLogin, id, isLoggedIn]);

  const handleLaunchGame = useCallback(() => {
    if (!game || !isLoggedIn) {
      return;
    }

    const playUrl = game.playUrl?.trim();
    if (!playUrl) {
      return;
    }

    // await せず同期で開く（recordPlay 待ちだと popup blocker で無反応になる）
    window.open(playUrl, "_blank", "noopener,noreferrer");
    setPlayed(true);
    setOverlayDismissed(false);
    sessionStorage.removeItem(overlayDismissKey(game.id));
    setPlayDialogOpen(false);
    setLaunchingGame(true);
    void recordPlay(
      game.id,
      adoptionVerifyContext
        ? {
            context: "adoption_verify",
            adoptionId: adoptionVerifyContext.id,
          }
        : undefined,
    )
      .catch(() => undefined)
      .finally(() => {
        setLaunchingGame(false);
      });
  }, [game, isLoggedIn, recordPlay, adoptionVerifyContext]);

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

  const handleVoiceComplete = useCallback(() => {
    voiceCompleteKnownRef.current = true;
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
  const isOwnerPreview = isProjectOwner(game.id, user?.id);
  const isPrivate = userSubmitted && game.visibility === "private";
  const showAdoptionVerifyBanner =
    adoptionPlayerVisible &&
    adoptionVerifyLoaded &&
    Boolean(adoptionVerifyContext) &&
    isLoggedIn &&
    !isOwnerPreview;

  const playLaunchAdoptionContext =
    adoptionPlayerVisible && showAdoptionVerifyBanner
      ? adoptionVerifyContext
      : null;

  const showPlayerVoiceFlow = isLoggedIn && played && !isOwnerPreview;

  if (isPrivate && !isOwnerPreview) {
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
        adoptionContext={playLaunchAdoptionContext}
      />

      {showPlayerVoiceFlow && voiceFlowState !== "voice_complete" && (
        <PostPlayVoiceOverlay
          mode={!voiceDataReady ? "hidden" : overlayMode}
          firstPromptPreview={firstPromptPreview}
          onDismiss={handleOverlayDismiss}
          onOpenForm={handleOpenVoiceForm}
        >
          <GameVoiceSection
            gameId={id}
            embedded
            showDeepFeedback={false}
            adoptionVerifyActive={Boolean(playLaunchAdoptionContext)}
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
              <h1 className="line-clamp-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {game.title}
              </h1>
              <p className="mt-1 text-sm text-zinc-500">{game.creator}</p>
              {isOwnerPreview && (
                <p className="mt-2 text-xs text-orange-300/80">
                  開発者プレビュー — プレイヤー向けページの見え方
                </p>
              )}
            </header>

            <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_232px] lg:items-start lg:gap-5 xl:grid-cols-[minmax(0,1.15fr)_248px] xl:gap-6">
              <div className="min-w-0">
                <GameDetailOverview game={game} />

                {showAdoptionVerifyBanner && adoptionVerifyContext && (
                  <AdoptionVerifyBanner
                    context={adoptionVerifyContext}
                    onPlayRequest={handlePlayRequest}
                  />
                )}

                {!isOwnerPreview && (
                  <GameChangeCheckSection
                    gameId={id}
                    playableVersion={game.playableVersion}
                    onTryVersion={handlePlayRequest}
                  />
                )}

                {!isOwnerPreview && <NewPlayableVersionBanner game={game} />}

                <GameDescriptionSection description={game.description} />

                <EveryonesVoiceSection
                  gameId={game.id}
                  playableVersion={game.playableVersion}
                />

                <GameProjectHistorySection game={game} />

                {isLoggedIn && !isOwnerPreview && (
                  <VoiceAdoptionsSection projectId={id} compact />
                )}

                {showPlayerVoiceFlow &&
                  voiceFlowState === "voice_complete" &&
                  voiceDataReady && (
                    <GameVoiceSection
                      gameId={id}
                      onFlowStateChange={handleVoiceFlowStateChange}
                      showDeepFeedback
                      adoptionVerifyActive={Boolean(playLaunchAdoptionContext)}
                    />
                  )}

                {!isOwnerPreview && voiceFlowState === "not_played" && (
                  <div className="mt-4 border-t border-zinc-800/80 pt-4">
                    {!isLoggedIn ? (
                      <>
                        <button
                          type="button"
                          onClick={() => goToLogin()}
                          title="ログインすると使えます"
                          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-orange-500/40 hover:text-orange-400"
                        >
                          ログインしてプレイ
                        </button>
                        <AuthGatedHint
                          hint="プレイ後に開発者の質問へ回答できます"
                          className="mt-2"
                        />
                      </>
                    ) : (
                      <p className="text-xs text-zinc-600">
                        プレイ後に、開発者の質問へ回答できます。
                      </p>
                    )}
                  </div>
                )}
              </div>

              <GameDetailSidebar
                game={game}
                userSubmitted={userSubmitted}
                isOwnerPreview={isOwnerPreview}
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
