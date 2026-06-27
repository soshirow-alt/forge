"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from "react";
import {
  GameVoiceSection,
  type GameVoiceFlowMeta,
} from "@/components/game-voice-section";
import {
  PostPlayVoiceOverlay,
  type VoiceOverlayMode,
} from "@/components/post-play-voice-overlay";
import { useGames } from "@/components/games-provider";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  derivePlayerVoiceFlowState,
  getFirstPromptPreview,
} from "@/lib/player-voice-flow-state";

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

export type GameDetailRealVoiceHandle = {
  openForm: () => void;
  notifyPlayComplete: () => void;
};

type GameDetailRealVoiceLayerProps = {
  gameId: string;
  played: boolean;
  onVoiceComplete?: () => void;
};

export const GameDetailRealVoiceLayer = forwardRef<
  GameDetailRealVoiceHandle,
  GameDetailRealVoiceLayerProps
>(function GameDetailRealVoiceLayer(
  { gameId, played, onVoiceComplete },
  ref,
) {
  const { isLoggedIn } = useRequireAuth();
  const [voiceFlowMeta, setVoiceFlowMeta] =
    useState<GameVoiceFlowMeta>(INITIAL_VOICE_FLOW_META);
  const [overlayMode, setOverlayMode] = useState<VoiceOverlayMode>("hidden");
  const [overlayDismissed, setOverlayDismissed] = useState(false);
  const [voiceDataReady, setVoiceDataReady] = useState(false);
  const voiceCompleteKnownRef = useRef(false);

  useEffect(() => {
    setOverlayDismissed(readOverlayDismissed(gameId));
  }, [gameId]);

  useEffect(() => {
    if (!isLoggedIn || !played) {
      setVoiceFlowMeta(INITIAL_VOICE_FLOW_META);
      setOverlayMode("hidden");
      setVoiceDataReady(false);
      voiceCompleteKnownRef.current = false;
    }
  }, [gameId, isLoggedIn, played]);

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

  const voiceFlowState = useMemo(() => {
    if (!isLoggedIn || !played) {
      return "not_played" as const;
    }

    if (!voiceDataReady) {
      return voiceCompleteKnownRef.current
        ? ("voice_complete" as const)
        : ("played_pending" as const);
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

  const handleOverlayDismiss = useCallback(() => {
    writeOverlayDismissed(gameId);
    setOverlayDismissed(true);
    setOverlayMode("hidden");
  }, [gameId]);

  const handleOpenVoiceForm = useCallback(() => {
    setOverlayMode("form");
  }, []);

  const handleVoiceComplete = useCallback(() => {
    voiceCompleteKnownRef.current = true;
    writeOverlayDismissed(gameId);
    setOverlayDismissed(true);
    setOverlayMode("hidden");
    onVoiceComplete?.();
  }, [gameId, onVoiceComplete]);

  useImperativeHandle(
    ref,
    () => ({
      openForm: () => {
        setOverlayDismissed(false);
        sessionStorage.removeItem(overlayDismissKey(gameId));
        setOverlayMode("form");
      },
      notifyPlayComplete: () => {
        setOverlayDismissed(false);
        sessionStorage.removeItem(overlayDismissKey(gameId));
        setOverlayMode("prompt");
      },
    }),
    [gameId],
  );

  return (
    <PostPlayVoiceOverlay
      mode={overlayMode}
      firstPromptPreview={firstPromptPreview}
      onDismiss={handleOverlayDismiss}
      onOpenForm={handleOpenVoiceForm}
    >
      <GameVoiceSection
        gameId={gameId}
        embedded
        showDeepFeedback={false}
        onFlowStateChange={handleVoiceFlowStateChange}
        onVoiceComplete={handleVoiceComplete}
      />
    </PostPlayVoiceOverlay>
  );
});

export function useGameDetailEngagement(gameId: string, enabled: boolean) {
  const {
    isWatching,
    isBookmarked,
    watchGame,
    unwatchGame,
    bookmarkGame,
    unbookmarkGame,
  } = useGames();

  const [watching, setWatching] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    setWatching(isWatching(gameId));
    setSaved(isBookmarked(gameId));
  }, [enabled, gameId, isWatching, isBookmarked]);

  const toggleWatch = useCallback(async (): Promise<boolean> => {
    if (!enabled) {
      return false;
    }
    if (watching) {
      await unwatchGame(gameId);
      setWatching(false);
      return false;
    }
    await watchGame(gameId);
    setWatching(true);
    return true;
  }, [enabled, gameId, watching, watchGame, unwatchGame]);

  const toggleSaved = useCallback(async () => {
    if (!enabled) {
      return;
    }
    if (saved) {
      await unbookmarkGame(gameId);
      setSaved(false);
      return;
    }
    await bookmarkGame(gameId);
    setSaved(true);
  }, [enabled, gameId, saved, bookmarkGame, unbookmarkGame]);

  return { watching, saved, toggleWatch, toggleSaved };
}
