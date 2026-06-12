"use client";

import { useGames } from "@/components/games-provider";
import {
  getActivityEventTypeLabel,
  getDefaultApplicantCount,
  getDefaultSupportCount,
  getGameActivitySnapshot,
} from "@/lib/demo-activity";
import { formatActivityDate } from "@/lib/project-activity";
import type { Game } from "@/lib/mock-games";

type GameRecentActivitySectionProps = {
  game: Pick<Game, "id" | "lastUpdated" | "lookingForTesters" | "testerSlots">;
};

const eventToneStyles = {
  launch: "text-zinc-400",
  tester_open: "text-violet-400",
  update: "text-orange-400",
  feedback_applied: "text-emerald-400",
} as const;

export function GameRecentActivitySection({ game }: GameRecentActivitySectionProps) {
  const { getSupportCount, getApplicantCount, isSubmittedGame } = useGames();
  const isSubmitted = isSubmittedGame(game.id);
  const snapshot = getGameActivitySnapshot(game, {
    isSubmitted,
    supportCount: getSupportCount(
      game.id,
      getDefaultSupportCount(game.id, isSubmitted),
    ),
    applicantCount: getApplicantCount(
      game.id,
      getDefaultApplicantCount(game.id, isSubmitted),
    ),
  });

  if (!snapshot) {
    return (
      <section className="mt-5 border-t border-zinc-800/80 pt-5 lg:mt-6">
        <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-600">
          最近の活動
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          まだ活動データはありません
        </p>
      </section>
    );
  }

  if (snapshot.recentEvents.length === 0) {
    return (
      <section className="mt-5 border-t border-zinc-800/80 pt-5 lg:mt-6">
        <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-600">
          最近の活動
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {snapshot.supportCount > 0 && (
            <li className="text-zinc-500">
              <span className="text-orange-400/90">応援</span>
              {" · "}
              {snapshot.supportCount}人
            </li>
          )}
          {snapshot.recentActivityLabel && (
            <li className="text-zinc-500">
              <span className="text-emerald-400/90">更新</span>
              {" · "}
              {snapshot.recentActivityLabel}
            </li>
          )}
        </ul>
      </section>
    );
  }

  return (
    <section className="mt-5 border-t border-zinc-800/80 pt-5 lg:mt-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-600">
          最近の活動
        </h2>
        {snapshot.recentActivityLabel && (
          <p className="text-xs text-zinc-600">{snapshot.recentActivityLabel}</p>
        )}
      </div>

      <ul className="mt-3 space-y-2.5">
        {snapshot.recentEvents.map((event) => (
          <li
            key={event.id}
            className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm"
          >
            <time
              dateTime={event.date}
              className="shrink-0 text-xs tabular-nums text-zinc-600"
            >
              {formatActivityDate(event.date)}
            </time>
            <span
              className={`shrink-0 text-xs font-medium ${eventToneStyles[event.type]}`}
            >
              {getActivityEventTypeLabel(event.type)}
            </span>
            <span className="text-zinc-400">{event.label}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600">
        <div>
          <dt className="inline">応援 </dt>
          <dd className="inline tabular-nums text-zinc-500">
            {snapshot.supportCount}
          </dd>
        </div>
        {game.lookingForTesters && snapshot.testerSlots > 0 && (
          <div>
            <dt className="inline">テスト参加 </dt>
            <dd className="inline tabular-nums text-zinc-500">
              {snapshot.testerAppliedCount}/{snapshot.testerSlots}
            </dd>
          </div>
        )}
        {snapshot.devlogCount > 0 && (
          <div>
            <dt className="inline">開発ログ </dt>
            <dd className="inline tabular-nums text-zinc-500">
              {snapshot.devlogCount}件
            </dd>
          </div>
        )}
        {snapshot.feedbackAppliedCount > 0 && (
          <div>
            <dt className="inline">反映済み提案 </dt>
            <dd className="inline tabular-nums text-zinc-500">
              {snapshot.feedbackAppliedCount}件
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
