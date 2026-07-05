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
  GuestVoiceSection,
  type GuestVoiceFlowMeta,
} from "@/components/guest-voice-section";
import {
  PostPlayVoiceOverlay,
  type VoiceOverlayMode,
} from "@/components/post-play-voice-overlay";
import {
  derivePlayerVoiceFlowState,
  getFirstPromptPreview,
} from "@/lib/player-voice-flow-state";

const INITIAL_VOICE_FLOW_META: GuestVoiceFlowMeta = {
  voiceComplete: false,
  prompts: [],
  loading: false,
};

function overlayDismissKey(gameId: string) {
  return `forge-guest-voice-overlay-dismissed-${gameId}`;
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

export type GameDetailGuestVoiceHandle = {
  openForm: () => void;
  notifyPlayComplete: () => void;
};

type GameDetailGuestVoiceLayerProps = {
  gameId: string;
  played: boolean;
  loginHref?: string;
  onVoiceComplete?: () => void;
};

export const GameDetailGuestVoiceLayer = forwardRef<
  GameDetailGuestVoiceHandle,
  GameDetailGuestVoiceLayerProps
>(function GameDetailGuestVoiceLayer(
  { gameId, played, loginHref, onVoiceComplete },
  ref,
) {
  const [voiceFlowMeta, setVoiceFlowMeta] =
    useState<GuestVoiceFlowMeta>(INITIAL_VOICE_FLOW_META);
  const [overlayMode, setOverlayMode] = useState<VoiceOverlayMode>("hidden");
  const [overlayDismissed, setOverlayDismissed] = useState(false);
  const [voiceDataReady, setVoiceDataReady] = useState(false);
  const voiceCompleteKnownRef = useRef(false);

  useEffect(() => {
    setOverlayDismissed(readOverlayDismissed(gameId));
  }, [gameId]);

  useEffect(() => {
    if (!played) {
      setVoiceFlowMeta(INITIAL_VOICE_FLOW_META);
      setOverlayMode("hidden");
      setVoiceDataReady(false);
      voiceCompleteKnownRef.current = false;
    }
  }, [gameId, played]);

  const handleVoiceFlowStateChange = useCallback((meta: GuestVoiceFlowMeta) => {
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
    if (!played) {
      return "not_played" as const;
    }

    if (!voiceDataReady) {
      return voiceCompleteKnownRef.current
        ? ("voice_complete" as const)
        : ("played_pending" as const);
    }

    return derivePlayerVoiceFlowState({
      isLoggedIn: true,
      played,
      voiceComplete: voiceFlowMeta.voiceComplete || voiceCompleteKnownRef.current,
    });
  }, [played, voiceDataReady, voiceFlowMeta.voiceComplete]);

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
      title="プレイありがとう"
      subtitle="ゲストとして、開発者から質問があります"
    >
      <GuestVoiceSection
        gameId={gameId}
        loginHref={loginHref}
        embedded
        showDeepFeedback={false}
        onFlowStateChange={handleVoiceFlowStateChange}
        onVoiceComplete={handleVoiceComplete}
      />
    </PostPlayVoiceOverlay>
  );
});
