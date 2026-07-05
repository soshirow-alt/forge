"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GuestDeepFeedbackForm } from "@/components/guest-deep-feedback-form";
import { FeedbackPublicDisplayConsent } from "@/components/feedback-public-display-consent";
import { VoicePromptCard } from "@/components/voice-prompt-card";
import { useGames } from "@/components/games-provider";
import { GAME_DEEP_FEEDBACK_ENTRY_ID } from "@/lib/game-feedback-ui";
import { ensureGuestSubmitter, postGuestVoice } from "@/lib/guest-feedback/client";
import { resolvePlayableVersion } from "@/lib/playable-version";
import type { VersionPrompt, VoiceAnswerDraft } from "@/lib/version-prompt-types";

type DraftAnswers = Record<
  string,
  { value: string; label: string; comment?: string }
>;

export type GuestVoiceFlowMeta = {
  voiceComplete: boolean;
  prompts: VersionPrompt[];
  loading: boolean;
};

type GuestVoiceSectionProps = {
  gameId: string;
  loginHref?: string;
  onFlowStateChange?: (meta: GuestVoiceFlowMeta) => void;
  onVoiceComplete?: () => void;
  embedded?: boolean;
  showDeepFeedback?: boolean;
};

export function GuestVoiceSection({
  gameId,
  loginHref,
  onFlowStateChange,
  onVoiceComplete,
  embedded = false,
  showDeepFeedback = true,
}: GuestVoiceSectionProps) {
  const { getGameById, getVersionPrompts } = useGames();
  const game = getGameById(gameId);
  const playableVersion = resolvePlayableVersion(game?.playableVersion);

  const [prompts, setPrompts] = useState<VersionPrompt[]>([]);
  const [submittedPromptIds, setSubmittedPromptIds] = useState<Set<string>>(() => new Set());
  const [drafts, setDrafts] = useState<DraftAnswers>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [publicDisplayConsent, setPublicDisplayConsent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [voiceComplete, setVoiceComplete] = useState(false);
  const [deepOpen, setDeepOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await ensureGuestSubmitter();
      const nextPrompts = await getVersionPrompts(gameId, playableVersion);
      setPrompts(nextPrompts);
    } catch {
      setSubmitError("送信の準備に失敗しました。ページを再読み込みしてください。");
    } finally {
      setLoading(false);
    }
  }, [gameId, playableVersion, getVersionPrompts]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading) {
      return;
    }
    onFlowStateChange?.({ voiceComplete, prompts, loading: false });
  }, [voiceComplete, prompts, loading, onFlowStateChange]);

  const pendingAnswers = useMemo(() => {
    const answers: VoiceAnswerDraft[] = [];
    for (const prompt of prompts) {
      const draft = drafts[prompt.id];
      if (draft?.value.trim()) {
        answers.push({
          promptId: prompt.id,
          answerValue: draft.value.trim(),
          answerLabel: draft.label.trim() || draft.value.trim(),
          optionalComment: draft.comment?.trim() || undefined,
        });
      }
    }
    return answers;
  }, [drafts, prompts]);

  const canSubmit = pendingAnswers.length >= 1 && publicDisplayConsent;

  async function handleSubmitVoice() {
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await postGuestVoice(
        gameId,
        playableVersion,
        pendingAnswers.map((answer) => ({
          promptId: answer.promptId,
          answerValue: answer.answerValue,
          answerLabel: answer.answerLabel,
          optionalComment: answer.optionalComment,
        })),
      );
      setSubmittedPromptIds((prev) => {
        const next = new Set(prev);
        for (const answer of pendingAnswers) {
          next.add(answer.promptId);
        }
        return next;
      });
      setVoiceComplete(true);
      onVoiceComplete?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "送信に失敗しました。時間をおいて再度お試しください。";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleDraftChange(promptId: string, answerValue: string, answerLabel: string) {
    setDrafts((prev) => ({
      ...prev,
      [promptId]: {
        value: answerValue,
        label: answerLabel,
        comment: prev[promptId]?.comment,
      },
    }));
  }

  function handleOptionalCommentChange(promptId: string, comment: string) {
    setDrafts((prev) => ({
      ...prev,
      [promptId]: {
        value: prev[promptId]?.value ?? "",
        label: prev[promptId]?.label ?? "",
        comment,
      },
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
          <p className="text-sm font-medium text-violet-300">ゲストとして開発者に届けました</p>
          <p className="mt-1 text-xs text-zinc-500">
            あなたの回答は v{playableVersion} 向けに届きます。ログイン後もこの内容は引き継がれません。
          </p>
        </section>
      );
    }

    return (
      <section className={sectionClassName}>
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-4">
          <p className="text-sm font-medium text-orange-300">ゲストとして開発者に届けました</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            あなたの回答は v{playableVersion} 向けに届きます。ログイン後もこの内容は引き継がれません。
          </p>
        </div>

        {showDeepFeedback ? (
          <div id={GAME_DEEP_FEEDBACK_ENTRY_ID} className="mt-4 scroll-mt-24">
            <button
              type="button"
              onClick={() => setDeepOpen((open) => !open)}
              className="text-xs font-medium text-zinc-500 transition-colors hover:text-orange-400/90"
            >
              {deepOpen ? "▾" : "▸"} 詳しい感想を書く（任意）
            </button>
            {deepOpen ? (
              <div className="mt-3">
                <GuestDeepFeedbackForm
                  gameId={gameId}
                  playableVersion={playableVersion}
                  loginHref={loginHref}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className={sectionClassName}>
      {!embedded ? (
        <>
          <h2 className="text-sm font-medium text-zinc-500">v{playableVersion} への回答</h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">
            ゲストとして、開発者からの質問に短く回答できます。
          </p>
        </>
      ) : null}
      <p
        className={`text-xs ${embedded ? "text-zinc-500" : "mt-1 text-orange-400/80"}`}
      >
        1つ答えるだけでOK。全部答える必要はありません。
      </p>

      <div className="mt-4 space-y-3">
        {prompts.map((prompt) => {
          const draft = drafts[prompt.id];
          return (
            <VoicePromptCard
              key={prompt.id}
              prompt={prompt}
              value={draft?.value}
              optionalComment={draft?.comment ?? ""}
              answered={submittedPromptIds.has(prompt.id)}
              onChange={(value, label) => handleDraftChange(prompt.id, value, label)}
              onOptionalCommentChange={(comment) =>
                handleOptionalCommentChange(prompt.id, comment)
              }
            />
          );
        })}
      </div>

      {submitError ? (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200"
        >
          {submitError}
        </p>
      ) : null}

      <div className="mt-4">
        <FeedbackPublicDisplayConsent
          idPrefix={`guest-voice-${gameId}`}
          checked={publicDisplayConsent}
          onCheckedChange={setPublicDisplayConsent}
        />
      </div>

      <button
        type="button"
        disabled={!canSubmit || submitting}
        onClick={() => {
          void handleSubmitVoice();
        }}
        className={
          embedded
            ? "mt-4 w-full rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
            : "mt-4 w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:opacity-50"
        }
      >
        {submitting ? "送信中..." : "ゲストとして回答する"}
      </button>
    </section>
  );
}
