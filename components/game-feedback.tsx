"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useGames } from "@/components/games-provider";
import {
  loadStoredFeedback,
  saveStoredFeedback,
  type FeedbackByGame,
  type GameFeedbackItem,
} from "@/lib/game-feedback-storage";

const checkboxOptions = [
  "戦闘が良い",
  "世界観が良い",
  "操作が分かりづらい",
  "テンポが悪い",
  "チュートリアルが必要",
  "もっと遊びたい",
] as const;

function RatingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <div className="mt-1.5 flex gap-1.5">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={
              value === rating
                ? "h-8 w-8 rounded-md border border-orange-500/40 bg-orange-500/10 text-xs font-medium text-orange-400"
                : "h-8 w-8 rounded-md border border-zinc-800 text-xs text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-400"
            }
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );
}

export function GameFeedbackForm({ gameId }: { gameId: string }) {
  const { addNotification } = useGames();
  const [feedbackByGame, setFeedbackByGame] = useState<FeedbackByGame>({});
  const [text, setText] = useState("");
  const [funRating, setFunRating] = useState(3);
  const [controlsRating, setControlsRating] = useState(3);
  const [replayRating, setReplayRating] = useState(3);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

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

  function toggleOption(option: string) {
    setSelectedOptions((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option],
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    const feedback: GameFeedbackItem = {
      id: `feedback-${Date.now()}`,
      text: trimmed,
      createdAt: new Date().toISOString(),
      funRating,
      controlsRating,
      replayRating,
      selectedOptions,
    };

    setFeedbackByGame((prev) => ({
      ...prev,
      [gameId]: [feedback, ...(prev[gameId] ?? [])],
    }));

    addNotification("feedback", gameId);

    setText("");
    setFunRating(3);
    setControlsRating(3);
    setReplayRating(3);
    setSelectedOptions([]);
  }

  return (
    <section className="mt-5 border-t border-zinc-800/80 pt-5">
      <h2 className="text-sm font-medium text-zinc-500">感想を送る</h2>
      <p className="mt-1 text-xs text-zinc-600">
        プレイありがとうございます。開発へのフィードバックを共有できます。
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-4 space-y-4 rounded-xl border border-zinc-800/60 bg-zinc-950/30 p-4"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <RatingInput label="面白さ" value={funRating} onChange={setFunRating} />
          <RatingInput
            label="操作性"
            value={controlsRating}
            onChange={setControlsRating}
          />
          <RatingInput
            label="続きを遊びたい度"
            value={replayRating}
            onChange={setReplayRating}
          />
        </div>

        <div>
          <p className="text-xs font-medium text-zinc-500">チェック項目</p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {checkboxOptions.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option)}
                  onChange={() => toggleOption(option)}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
                />
                <span className="text-sm text-zinc-400">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          placeholder="感想や改善点、バグ報告など"
          className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/40 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
        />
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

// Legacy export for any remaining imports
export function GameFeedback({
  gameId,
  canSubmit = false,
}: {
  gameId: string;
  canSubmit?: boolean;
}) {
  if (!canSubmit) {
    return null;
  }

  return <GameFeedbackForm gameId={gameId} />;
}
