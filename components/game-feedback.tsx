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
  muted = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  muted?: boolean;
}) {
  return (
    <div>
      <p
        className={
          muted
            ? "text-xs font-medium text-zinc-500"
            : "text-sm font-medium text-zinc-400"
        }
      >
        {label}
      </p>
      <div className="mt-1.5 flex gap-1.5">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={
              value === rating
                ? muted
                  ? "h-8 w-8 rounded-md border border-orange-500/40 bg-orange-500/10 text-xs font-medium text-orange-400"
                  : "h-9 w-9 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-sm font-semibold text-zinc-950"
                : muted
                  ? "h-8 w-8 rounded-md border border-zinc-800 text-xs text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-400"
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

export function GameFeedback({
  gameId,
  compact = false,
  deferred = false,
}: {
  gameId: string;
  compact?: boolean;
  deferred?: boolean;
}) {
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

  const sectionClass = deferred
    ? "mt-6 border-t border-zinc-800/80 pt-6"
    : compact
      ? undefined
      : "mt-8 border-t border-zinc-800 pt-8";

  const panelClass = deferred
    ? "mt-4 rounded-xl border border-zinc-800/60 bg-zinc-950/30 p-4 sm:p-5"
    : compact
      ? "mt-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3"
      : "mt-6 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4";

  return (
    <section className={sectionClass}>
      <h2
        className={
          deferred
            ? "text-xs font-medium uppercase tracking-wide text-zinc-600"
            : "text-sm font-medium text-zinc-500"
        }
      >
        {deferred ? "プレイ後のフィードバック" : "フィードバック"}
      </h2>
      {deferred && (
        <p className="mt-1.5 text-sm text-zinc-500">
          ゲームを体験してから、評価やコメントを残せます。
        </p>
      )}

      <div className={deferred ? panelClass : undefined}>
        <form
          onSubmit={handleSubmit}
          className={deferred ? "space-y-4" : compact ? "mt-4 space-y-4" : "mt-6 space-y-6"}
        >
          <div className={`grid gap-4 ${deferred ? "sm:grid-cols-3" : "sm:grid-cols-3"}`}>
            <RatingInput
              label="面白さ"
              value={funRating}
              onChange={setFunRating}
              muted={deferred}
            />
            <RatingInput
              label="操作性"
              value={controlsRating}
              onChange={setControlsRating}
              muted={deferred}
            />
            <RatingInput
              label="続きを遊びたい度"
              value={replayRating}
              onChange={setReplayRating}
              muted={deferred}
            />
          </div>

          <div>
            <p
              className={
                deferred
                  ? "text-xs font-medium text-zinc-500"
                  : "text-sm font-medium text-zinc-400"
              }
            >
              チェック項目
            </p>
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
            rows={deferred ? 3 : 4}
            placeholder="感想や改善点、バグ報告など"
            className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/40 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
          />
          <button
            type="submit"
            className={
              deferred
                ? "rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-orange-500/40 hover:text-orange-400"
                : "rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
            }
          >
            フィードバックを送る
          </button>
        </form>
      </div>

      {feedbackItems.length > 0 && (
        <div
          className={
            deferred
              ? "mt-5 rounded-lg border border-zinc-800/60 bg-zinc-950/20 p-4"
              : compact
                ? "mt-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3"
                : "mt-6 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
          }
        >
          <h3 className="text-xs font-medium text-zinc-500">コミュニティの声</h3>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-zinc-600">平均面白さ</dt>
              <dd className="mt-0.5 text-sm font-medium text-zinc-400">
                {formatAverage(summary.fun)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-600">平均操作性</dt>
              <dd className="mt-0.5 text-sm font-medium text-zinc-400">
                {formatAverage(summary.controls)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-600">平均続きを遊びたい度</dt>
              <dd className="mt-0.5 text-sm font-medium text-zinc-400">
                {formatAverage(summary.replay)}
              </dd>
            </div>
          </dl>
          {summary.topOptions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-zinc-600">よく選ばれた意見</p>
              <ul className="mt-1.5 space-y-1">
                {summary.topOptions.map(([option, count]) => (
                  <li key={option} className="text-sm text-zinc-500">
                    {option}
                    <span className="ml-2 text-zinc-600">({count}件)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {feedbackItems.length > 0 ? (
        <ul className={deferred ? "mt-4 space-y-3" : compact ? "mt-3 space-y-3" : "mt-6 space-y-4"}>
          {feedbackItems.map((item) => (
            <li
              key={item.id}
              className={
                deferred
                  ? "rounded-lg border border-zinc-800/60 bg-zinc-950/20 p-3"
                  : "rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
              }
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
        !deferred && (
          <p className={compact ? "mt-2 text-sm text-zinc-600" : "mt-4 text-sm text-zinc-600"}>
            まだコメントはありません。
          </p>
        )
      )}
    </section>
  );
}
