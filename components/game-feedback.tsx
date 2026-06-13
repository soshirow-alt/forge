"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useGames } from "@/components/games-provider";
import {
  feedbackHasContent,
  loadStoredFeedback,
  replayIntentLabel,
  saveStoredFeedback,
  type FeedbackByGame,
  type GameFeedbackItem,
  type ReplayIntent,
} from "@/lib/game-feedback-storage";

const inputClassName =
  "w-full resize-y rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/40 focus:outline-none focus:ring-1 focus:ring-orange-500/30";

type GameFeedbackFormProps = {
  gameId: string;
  focusNotes?: string;
};

export function GameFeedbackForm({ gameId, focusNotes }: GameFeedbackFormProps) {
  const { addNotification } = useGames();
  const [feedbackByGame, setFeedbackByGame] = useState<FeedbackByGame>({});
  const [goodPoints, setGoodPoints] = useState("");
  const [concerns, setConcerns] = useState("");
  const [bugs, setBugs] = useState("");
  const [focusResponse, setFocusResponse] = useState("");
  const [wouldReplay, setWouldReplay] = useState<ReplayIntent | "">("");
  const [hydrated, setHydrated] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setFeedbackByGame(loadStoredFeedback());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    saveStoredFeedback(feedbackByGame);
  }, [feedbackByGame, hydrated]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const feedback: GameFeedbackItem = {
      id: `feedback-${Date.now()}`,
      createdAt: new Date().toISOString(),
      goodPoints: goodPoints.trim() || undefined,
      concerns: concerns.trim() || undefined,
      bugs: bugs.trim() || undefined,
      focusResponse: focusResponse.trim() || undefined,
      wouldReplay: wouldReplay || undefined,
    };

    if (!feedbackHasContent(feedback)) {
      return;
    }

    setFeedbackByGame((prev) => ({
      ...prev,
      [gameId]: [feedback, ...(prev[gameId] ?? [])],
    }));

    addNotification("feedback", gameId);
    setSubmitted(true);
    setGoodPoints("");
    setConcerns("");
    setBugs("");
    setFocusResponse("");
    setWouldReplay("");
  }

  if (submitted) {
    return (
      <section className="mt-4 border-t border-zinc-800/80 pt-4">
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3">
          <p className="text-sm font-medium text-orange-300">
            フィードバックを送信しました
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            開発者の改善に役立てられます。アップデート後にもう一度遊べます。
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-4 border-t border-zinc-800/80 pt-4">
      <h2 className="text-sm font-medium text-zinc-500">プレイ後フィードバック</h2>
      <p className="mt-1 text-xs text-zinc-600">
        感想は開発者への改善材料として届きます。星評価ではなく、具体的な観点で書いてください。
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
          className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-orange-500/40 hover:text-orange-400"
        >
          フィードバックを送る
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
