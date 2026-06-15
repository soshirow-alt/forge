"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GameDeepFeedbackForm } from "@/components/game-deep-feedback-form";
import { VoicePromptCard } from "@/components/voice-prompt-card";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import { GAME_DEEP_FEEDBACK_ENTRY_ID } from "@/lib/game-feedback-ui";
import { resolvePlayableVersion } from "@/lib/playable-version";
import type { VoiceAnswerDraft } from "@/lib/version-prompt-types";
import type { VersionPrompt } from "@/lib/version-prompt-types";
import type { VoiceResponse } from "@/lib/version-prompt-types";
import { hasInitialVoiceComplete } from "@/lib/supabase/voice-engagement";

type DraftAnswers = Record<string, { value: string; label: string }>;

export type GameVoiceFlowMeta = {
  voiceComplete: boolean;
  prompts: VersionPrompt[];
  loading: boolean;
};

type GameVoiceSectionProps = {
  gameId: string;
  onFlowStateChange?: (meta: GameVoiceFlowMeta) => void;
  onVoiceComplete?: () => void;
  embedded?: boolean;
  showDeepFeedback?: boolean;
};

export function GameVoiceSection({
  gameId,
  onFlowStateChange,
  onVoiceComplete,
  embedded = false,
  showDeepFeedback = true,
}: GameVoiceSectionProps) {
  const { user } = useAuth();
  const {
    getGameById,
    getVersionPrompts,
    getMyVoiceResponses,
    submitVoiceResponses,
  } = useGames();
  const game = getGameById(gameId);
  const playableVersion = resolvePlayableVersion(game?.playableVersion);

  const [prompts, setPrompts] = useState<VersionPrompt[]>([]);
  const [savedResponses, setSavedResponses] = useState<VoiceResponse[]>([]);
  const [drafts, setDrafts] = useState<DraftAnswers>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [voiceComplete, setVoiceComplete] = useState(false);
  const [deepOpen, setDeepOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextPrompts, responses] = await Promise.all([
        getVersionPrompts(gameId, playableVersion),
        user ? getMyVoiceResponses(gameId, playableVersion) : Promise.resolve([]),
      ]);
      setPrompts(nextPrompts);
      setSavedResponses(responses);
      setVoiceComplete(hasInitialVoiceComplete(responses));

      const initialDrafts: DraftAnswers = {};
      for (const response of responses) {
        initialDrafts[response.promptId] = {
          value: response.answerValue,
          label: response.answerLabel ?? response.answerValue,
        };
      }
      setDrafts(initialDrafts);
    } finally {
      setLoading(false);
    }
  }, [
    gameId,
    playableVersion,
    getVersionPrompts,
    getMyVoiceResponses,
    user,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    onFlowStateChange?.({ voiceComplete, prompts, loading });
  }, [voiceComplete, prompts, loading, onFlowStateChange]);

  const pendingAnswers = useMemo(() => {
    const answers: VoiceAnswerDraft[] = [];
    for (const prompt of prompts) {
      const draft = drafts[prompt.id];
      if (draft?.value.trim()) {
        answers.push({
          promptId: prompt.id,
          answerValue: draft.value.trim(),
          answerLabel: draft.label,
        });
      }
    }
    return answers;
  }, [drafts, prompts]);

  const canSubmit = pendingAnswers.length >= 1;

  async function handleSubmitVoice() {
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    try {
      const saved = await submitVoiceResponses(
        gameId,
        playableVersion,
        pendingAnswers,
      );
      setSavedResponses(saved);
      const complete = hasInitialVoiceComplete(saved);
      setVoiceComplete(complete);
      if (complete) {
        onVoiceComplete?.();
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleDraftChange(
    promptId: string,
    answerValue: string,
    answerLabel: string,
  ) {
    setDrafts((prev) => ({
      ...prev,
      [promptId]: { value: answerValue, label: answerLabel },
    }));
  }

  const sectionClassName = embedded
    ? ""
    : "mt-4 border-t border-zinc-800/80 pt-4";

  if (loading) {
    return (
      <section className={sectionClassName}>
        <p className="text-sm text-zinc-600">読み込み中...</p>
      </section>
    );
  }

  if (voiceComplete && !submitting) {
    if (embedded) {
      return (
        <section className={sectionClassName}>
          <p className="text-sm font-medium text-orange-300">声を届けました</p>
          <p className="mt-1 text-xs text-zinc-500">
            あなたの声は v{playableVersion} の改善材料として開発者に届きます。
          </p>
        </section>
      );
    }

    return (
      <section className={sectionClassName}>
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-4">
          <p className="text-sm font-medium text-orange-300">声を届けました</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            あなたの声は v{playableVersion} の改善材料として開発者に届きます。
            更新が公開されたら、ここで育ちを確認できます。
          </p>
        </div>

        {showDeepFeedback && (
          <div id={GAME_DEEP_FEEDBACK_ENTRY_ID} className="mt-4 scroll-mt-24">
            <button
              type="button"
              onClick={() => setDeepOpen((open) => !open)}
              className="text-xs font-medium text-zinc-500 transition-colors hover:text-orange-400/90"
            >
              {deepOpen ? "▾" : "▸"} もっと詳しく伝えたい（任意）
            </button>
            {deepOpen && (
              <div className="mt-3">
                <GameDeepFeedbackForm gameId={gameId} />
              </div>
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className={sectionClassName}>
      {!embedded && (
        <>
          <h2 className="text-sm font-medium text-zinc-500">
            v{playableVersion} への声
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">
            開発者からの質問に、短く声を届けられます。
          </p>
        </>
      )}
      <p className={`text-xs text-orange-400/80 ${embedded ? "" : "mt-1"}`}>
        1つ答えるだけでOK。全部答える必要はありません。
      </p>

      <div className="mt-4 space-y-3">
        {prompts.map((prompt) => {
          const saved = savedResponses.find((r) => r.promptId === prompt.id);
          const draft = drafts[prompt.id];
          return (
            <VoicePromptCard
              key={prompt.id}
              prompt={prompt}
              value={draft?.value}
              answered={Boolean(saved)}
              onChange={(value, label) =>
                handleDraftChange(prompt.id, value, label)
              }
            />
          );
        })}
      </div>

      <button
        type="button"
        disabled={!canSubmit || submitting}
        onClick={() => {
          void handleSubmitVoice();
        }}
        className="mt-4 w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "送信中..." : "声を届ける"}
      </button>

      {showDeepFeedback && !embedded && (
        <div id={GAME_DEEP_FEEDBACK_ENTRY_ID} className="mt-4 scroll-mt-24">
          <button
            type="button"
            onClick={() => setDeepOpen((open) => !open)}
            className="text-xs font-medium text-zinc-500 transition-colors hover:text-orange-400/90"
          >
            {deepOpen ? "▾" : "▸"} もっと詳しく伝えたい（任意）
          </button>
          {deepOpen && (
            <div className="mt-3">
              <GameDeepFeedbackForm gameId={gameId} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
