"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useGames } from "@/components/games-provider";

type GameFeedbackItem = {
  id: string;
  text: string;
  createdAt: string;
  funRating: number;
  controlsRating: number;
  replayRating: number;
  selectedOptions: string[];
};

type FeedbackByGame = Record<string, GameFeedbackItem[]>;

const FEEDBACK_STORAGE_KEY = "forge-game-feedback";

const checkboxOptions = [
  "戦闘が良い",
  "世界観が良い",
  "操作が分かりづらい",
  "テンポが悪い",
  "チュートリアルが必要",
  "もっと遊びたい",
] as const;

function loadFeedback(): FeedbackByGame {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as FeedbackByGame;
    }

    const legacyStored = localStorage.getItem("forge-game-comments");
    if (!legacyStored) {
      return {};
    }

    const legacy = JSON.parse(legacyStored) as Record<
      string,
      { id: string; text: string; createdAt: string }[]
    >;

    const migrated: FeedbackByGame = {};
    for (const [gameId, items] of Object.entries(legacy)) {
      migrated[gameId] = items.map((item) => ({
        id: item.id,
        text: item.text,
        createdAt: item.createdAt,
        funRating: 3,
        controlsRating: 3,
        replayRating: 3,
        selectedOptions: [],
      }));
    }

    return migrated;
  } catch {
    return {};
  }
}

function formatFeedbackDate(date: string) {
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatAverage(value: number) {
  return value > 0 ? value.toFixed(1) : "-";
}

function getTopOptions(items: GameFeedbackItem[], limit = 3) {
  const counts = new Map<string, number>();

  for (const item of items) {
    for (const option of item.selectedOptions) {
      counts.set(option, (counts.get(option) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

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
      <p className="text-sm font-medium text-zinc-400">{label}</p>
      <div className="mt-2 flex gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={
              value === rating
                ? "h-9 w-9 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-sm font-semibold text-zinc-950"
                : "h-9 w-9 rounded-lg border border-zinc-700 text-sm text-zinc-300 transition-colors hover:border-orange-500/50 hover:text-orange-400"
            }
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );
}

export function GameFeedback({ gameId }: { gameId: string }) {
  const { addNotification } = useGames();
  const [feedbackByGame, setFeedbackByGame] = useState<FeedbackByGame>({});
  const [text, setText] = useState("");
  const [funRating, setFunRating] = useState(3);
  const [controlsRating, setControlsRating] = useState(3);
  const [replayRating, setReplayRating] = useState(3);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFeedbackByGame(loadFeedback());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedbackByGame));
  }, [feedbackByGame, hydrated]);

  const feedbackItems = feedbackByGame[gameId] ?? [];

  const summary = useMemo(() => {
    return {
      fun: average(feedbackItems.map((item) => item.funRating)),
      controls: average(feedbackItems.map((item) => item.controlsRating)),
      replay: average(feedbackItems.map((item) => item.replayRating)),
      topOptions: getTopOptions(feedbackItems),
    };
  }, [feedbackItems]);

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
    <div className="mt-8 border-t border-zinc-800 pt-8">
      <h2 className="text-sm font-medium text-zinc-500">フィードバック</h2>

      {feedbackItems.length > 0 && (
        <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
          <h3 className="text-sm font-medium text-zinc-400">フィードバック概要</h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-zinc-500">平均面白さ</dt>
              <dd className="mt-1 text-lg font-semibold text-orange-400">
                {formatAverage(summary.fun)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-zinc-500">平均操作性</dt>
              <dd className="mt-1 text-lg font-semibold text-orange-400">
                {formatAverage(summary.controls)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-zinc-500">平均続きを遊びたい度</dt>
              <dd className="mt-1 text-lg font-semibold text-orange-400">
                {formatAverage(summary.replay)}
              </dd>
            </div>
          </dl>
          {summary.topOptions.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-zinc-500">よく選ばれた意見 top 3</p>
              <ul className="mt-2 space-y-1">
                {summary.topOptions.map(([option, count]) => (
                  <li key={option} className="text-sm text-zinc-300">
                    {option}
                    <span className="ml-2 text-zinc-500">({count}件)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {feedbackItems.length > 0 ? (
        <ul className="mt-6 space-y-4">
          {feedbackItems.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
            >
              <p className="text-sm text-zinc-500">
                {formatFeedbackDate(item.createdAt)}
              </p>
              <dl className="mt-3 grid gap-2 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-zinc-500">面白さ</dt>
                  <dd className="text-sm text-zinc-200">{item.funRating}/5</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">操作性</dt>
                  <dd className="text-sm text-zinc-200">{item.controlsRating}/5</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">続きを遊びたい度</dt>
                  <dd className="text-sm text-zinc-200">{item.replayRating}/5</dd>
                </div>
              </dl>
              {item.selectedOptions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.selectedOptions.map((option) => (
                    <span
                      key={option}
                      className="rounded-md border border-zinc-700 bg-zinc-800/80 px-2 py-0.5 text-xs text-zinc-400"
                    >
                      {option}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-3 leading-relaxed text-zinc-300">{item.text}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-zinc-600">まだコメントはありません。</p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid gap-5 sm:grid-cols-3">
          <RatingInput
            label="面白さ"
            value={funRating}
            onChange={setFunRating}
          />
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
          <p className="text-sm font-medium text-zinc-400">チェック項目</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {checkboxOptions.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option)}
                  onChange={() => toggleOption(option)}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
                />
                <span className="text-sm text-zinc-300">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={4}
          placeholder="感想や改善点を書いてください"
          className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
        />
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
        >
          コメントする
        </button>
      </form>
    </div>
  );
}
