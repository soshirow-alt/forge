"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import {
  feedbackHasContent,
  replayIntentLabel,
  type GameFeedbackItem,
  type ReplayIntent,
} from "@/lib/game-feedback-storage";
import { resolvePlayableVersion } from "@/lib/playable-version";

const inputClassName =
  "w-full resize-y rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/40 focus:outline-none focus:ring-1 focus:ring-orange-500/30";

type GameFeedbackFormProps = {
  gameId: string;
  focusNotes?: string;
};

function applyFeedbackToForm(
  item: GameFeedbackItem,
  setters: {
    setGoodPoints: (value: string) => void;
    setConcerns: (value: string) => void;
    setBugs: (value: string) => void;
    setFocusResponse: (value: string) => void;
    setWouldReplay: (value: ReplayIntent | "") => void;
  },
) {
  setters.setGoodPoints(item.goodPoints ?? "");
  setters.setConcerns(item.concerns ?? "");
  setters.setBugs(item.bugs ?? "");
  setters.setFocusResponse(item.focusResponse ?? "");
  setters.setWouldReplay(item.wouldReplay ?? "");
}

export function GameFeedbackForm({ gameId, focusNotes }: GameFeedbackFormProps) {
  const { user } = useAuth();
  const { getGameById, getMyFeedbackForProject, submitProjectFeedback } =
    useGames();
  const game = getGameById(gameId);
  const playableVersion = resolvePlayableVersion(game?.playableVersion);

  const [goodPoints, setGoodPoints] = useState("");
  const [concerns, setConcerns] = useState("");
  const [bugs, setBugs] = useState("");
  const [focusResponse, setFocusResponse] = useState("");
  const [wouldReplay, setWouldReplay] = useState<ReplayIntent | "">("");
  const [existingFeedback, setExistingFeedback] = useState<GameFeedbackItem | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    void getMyFeedbackForProject(gameId)
      .then((item) => {
        setExistingFeedback(item);
        if (item) {
          applyFeedbackToForm(item, {
            setGoodPoints,
            setConcerns,
            setBugs,
            setFocusResponse,
            setWouldReplay,
          });
        }
      })
      .catch(() => {
        setExistingFeedback(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [gameId, user, playableVersion, getMyFeedbackForProject]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const feedback: Omit<
      GameFeedbackItem,
      "id" | "createdAt" | "versionKey" | "updatedAt"
    > = {
      goodPoints: goodPoints.trim() || undefined,
      concerns: concerns.trim() || undefined,
      bugs: bugs.trim() || undefined,
      focusResponse: focusResponse.trim() || undefined,
      wouldReplay: wouldReplay || undefined,
    };

    if (!feedbackHasContent(feedback)) {
      return;
    }

    setSubmitting(true);
    try {
      const item = await submitProjectFeedback(gameId, feedback);
      setExistingFeedback(item);
      setSaved(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="mt-4 border-t border-zinc-800/80 pt-4">
        <p className="text-sm text-zinc-600">フィードバックを読み込み中...</p>
      </section>
    );
  }

  if (saved && !submitting) {
    return (
      <section className="mt-4 border-t border-zinc-800/80 pt-4">
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3">
          <p className="text-sm font-medium text-orange-300">
            {existingFeedback?.updatedAt
              ? "フィードバックを更新しました"
              : "フィードバックを送信しました"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            プレイ可能版 {playableVersion} 向けの改善材料として届きます。同じ版ではあとから編集できます。
          </p>
          <button
            type="button"
            onClick={() => setSaved(false)}
            className="mt-3 text-xs font-medium text-orange-400/90 transition-colors hover:text-orange-300"
          >
            編集を続ける
          </button>
        </div>
      </section>
    );
  }

  const isEditing = Boolean(existingFeedback);

  return (
    <section className="mt-4 border-t border-zinc-800/80 pt-4">
      <h2 className="text-sm font-medium text-zinc-500">プレイ後フィードバック</h2>
      <p className="mt-1 text-xs text-zinc-600">
        プレイ可能版 <span className="text-zinc-500">{playableVersion}</span>
        向けの改善材料です。{isEditing ? "内容はあとから編集できます。" : "1版につき1件送信できます。"}
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-4 space-y-4 rounded-xl border border-zinc-800/60 bg-zinc-950/30 p-4"
      >
        <div>
          <label htmlFor="goodPoints" className="text-xs font-medium text-zinc-500">
            良かった点
          </label>
          <textarea
            id="goodPoints"
            rows={2}
            value={goodPoints}
            onChange={(event) => setGoodPoints(event.target.value)}
            className={`${inputClassName} mt-1.5`}
            placeholder="例：操作が気持ちよく、世界観に引き込まれた"
          />
        </div>

        <div>
          <label htmlFor="concerns" className="text-xs font-medium text-zinc-500">
            気になった点
          </label>
          <textarea
            id="concerns"
            rows={2}
            value={concerns}
            onChange={(event) => setConcerns(event.target.value)}
            className={`${inputClassName} mt-1.5`}
            placeholder="例：チュートリアルが短く、目的が分かりにくかった"
          />
        </div>

        <div>
          <label htmlFor="bugs" className="text-xs font-medium text-zinc-500">
            バグっぽい挙動
          </label>
          <textarea
            id="bugs"
            rows={2}
            value={bugs}
            onChange={(event) => setBugs(event.target.value)}
            className={`${inputClassName} mt-1.5`}
            placeholder="例：特定の部屋で操作不能になる"
          />
        </div>

        {focusNotes && (
          <div>
            <label htmlFor="focusResponse" className="text-xs font-medium text-zinc-500">
              開発者が見てほしい観点への回答
            </label>
            <p className="mt-1 text-xs text-zinc-600">{focusNotes}</p>
            <textarea
              id="focusResponse"
              rows={2}
              value={focusResponse}
              onChange={(event) => setFocusResponse(event.target.value)}
              className={`${inputClassName} mt-1.5`}
              placeholder="上記の観点について感じたことを書いてください"
            />
          </div>
        )}

        <fieldset>
          <legend className="text-xs font-medium text-zinc-500">
            もう一度遊びたいか
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                { value: "yes", label: replayIntentLabel("yes") },
                { value: "maybe", label: replayIntentLabel("maybe") },
                { value: "no", label: replayIntentLabel("no") },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-lg border px-3 py-2 text-xs transition-colors ${
                  wouldReplay === option.value
                    ? "border-orange-500/40 bg-orange-500/10 text-orange-300"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-400"
                }`}
              >
                <input
                  type="radio"
                  name="wouldReplay"
                  value={option.value}
                  checked={wouldReplay === option.value}
                  onChange={() => setWouldReplay(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
        >
          {submitting
            ? "送信中..."
            : isEditing
              ? "感想を更新する"
              : "感想を届ける"}
        </button>
      </form>
    </section>
  );
}

export function GameFeedback({
  gameId,
  canSubmit = false,
  focusNotes,
}: {
  gameId: string;
  canSubmit?: boolean;
  focusNotes?: string;
}) {
  if (!canSubmit) {
    return null;
  }

  return <GameFeedbackForm gameId={gameId} focusNotes={focusNotes} />;
}
