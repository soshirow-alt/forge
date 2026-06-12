"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatStars,
  getDemoCommunityData,
  type DemoCommunityComment,
} from "@/lib/demo-community";
import { loadStoredFeedback, type GameFeedbackItem } from "@/lib/game-feedback-storage";

type GameCommunityVoicesSectionProps = {
  gameId: string;
};

function formatAverage(value: number) {
  return value > 0 ? value.toFixed(1) : "-";
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function mergeComments(
  demoComments: DemoCommunityComment[],
  stored: GameFeedbackItem[],
): { text: string; funRating: number; date: string }[] {
  const fromStored = stored.slice(0, 2).map((item) => ({
    text: item.text,
    funRating: item.funRating,
    date: item.createdAt.split("T")[0] ?? item.createdAt,
  }));

  if (fromStored.length >= 2) {
    return fromStored;
  }

  return [
    ...fromStored,
    ...demoComments.slice(0, 3 - fromStored.length).map((item) => ({
      text: item.text,
      funRating: item.funRating,
      date: item.date,
    })),
  ];
}

export function GameCommunityVoicesSection({
  gameId,
}: GameCommunityVoicesSectionProps) {
  const [storedFeedback, setStoredFeedback] = useState<GameFeedbackItem[]>([]);
  const demo = getDemoCommunityData(gameId);

  useEffect(() => {
    const all = loadStoredFeedback();
    setStoredFeedback(all[gameId] ?? []);
  }, [gameId]);

  const summary = useMemo(() => {
    if (storedFeedback.length > 0) {
      return {
        fun: average(storedFeedback.map((item) => item.funRating)),
        controls: average(storedFeedback.map((item) => item.controlsRating)),
        replay: average(storedFeedback.map((item) => item.replayRating)),
      };
    }

    return demo?.averageRatings ?? null;
  }, [storedFeedback, demo]);

  const comments = useMemo(() => {
    if (demo) {
      return mergeComments(demo.communityComments, storedFeedback);
    }

    return storedFeedback.slice(0, 3).map((item) => ({
      text: item.text,
      funRating: item.funRating,
      date: item.createdAt.split("T")[0] ?? item.createdAt,
    }));
  }, [demo, storedFeedback]);

  const highlights = useMemo(() => {
    const fromDemo = demo?.feedbackHighlights ?? [];
    const optionCounts = new Map<string, number>();

    for (const item of storedFeedback) {
      for (const option of item.selectedOptions) {
        optionCounts.set(option, (optionCounts.get(option) ?? 0) + 1);
      }
    }

    const fromStored = [...optionCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([label]) => label);

    if (fromStored.length > 0) {
      return fromStored;
    }

    return fromDemo;
  }, [demo, storedFeedback]);

  if (!demo && storedFeedback.length === 0) {
    return (
      <section className="mt-5 border-t border-zinc-800/80 pt-5">
        <h2 className="text-sm font-medium text-zinc-500">コミュニティの声</h2>
        <p className="mt-2 text-sm text-zinc-600">
          まだプレイヤーの声はありません
        </p>
      </section>
    );
  }

  return (
    <section className="mt-5 border-t border-zinc-800/80 pt-5">
      <h2 className="text-sm font-medium text-zinc-500">コミュニティの声</h2>

      {demo && demo.communityHighlights.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {demo.communityHighlights.map((item) => (
            <li
              key={item.text}
              className="flex items-baseline gap-2 text-sm text-zinc-300"
            >
              <span className="shrink-0 text-xs tracking-tight text-amber-400/90">
                {formatStars(item.stars)}
              </span>
              <span className="text-zinc-400">{item.text}</span>
            </li>
          ))}
        </ul>
      )}

      {summary && (
        <dl className="mt-4 grid grid-cols-3 gap-3 rounded-lg border border-zinc-800/60 bg-zinc-950/30 px-3 py-3">
          <div>
            <dt className="text-[11px] text-zinc-600">面白さ</dt>
            <dd className="mt-0.5 text-sm font-medium tabular-nums text-zinc-300">
              {formatAverage(summary.fun)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-zinc-600">操作性</dt>
            <dd className="mt-0.5 text-sm font-medium tabular-nums text-zinc-300">
              {formatAverage(summary.controls)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-zinc-600">続きたい度</dt>
            <dd className="mt-0.5 text-sm font-medium tabular-nums text-zinc-300">
              {formatAverage(summary.replay)}
            </dd>
          </div>
        </dl>
      )}

      {comments.length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {comments.map((comment) => (
            <li
              key={`${comment.date}-${comment.text.slice(0, 24)}`}
              className="rounded-lg border border-zinc-800/50 bg-zinc-950/25 px-3 py-2.5"
            >
              <div className="flex items-center gap-2 text-xs text-amber-400/80">
                <span>{formatStars(comment.funRating)}</span>
                <span className="text-zinc-600">{comment.date}</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                {comment.text}
              </p>
            </li>
          ))}
        </ul>
      )}

      {highlights.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-medium text-zinc-600">よく挙がる声</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {highlights.map((label) => (
              <span
                key={label}
                className="rounded-full border border-zinc-800 bg-zinc-950/40 px-2.5 py-0.5 text-xs text-zinc-500"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
