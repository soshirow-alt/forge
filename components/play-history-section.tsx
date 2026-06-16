"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CreatorLink } from "@/components/creator-link";
import {
  ForgeGameCard,
  type ForgeGameCardBadge,
} from "@/components/forge-game-card";
import { PlayTypeLabel } from "@/components/play-type-label";
import { useGames } from "@/components/games-provider";
import { usePlayerPlayHistory } from "@/hooks/use-player-play-history";
import {
  formatPlayHistoryDate,
  type PlayHistoryProjectTimeline,
} from "@/lib/player-play-timeline";

function timelineBadges(timeline: PlayHistoryProjectTimeline): ForgeGameCardBadge[] {
  return timeline.summary.badges.map((badge) => ({
    id: badge.id,
    emoji: badge.emoji,
    label: badge.label,
  }));
}

function PlayHistoryProjectCard({
  timeline,
  defaultExpanded,
}: {
  timeline: PlayHistoryProjectTimeline;
  defaultExpanded: boolean;
}) {
  const { getGameById } = useGames();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const game = getGameById(timeline.projectId);

  if (!game) {
    return null;
  }

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setExpanded((current) => !current);
          }
        }}
        className="cursor-pointer transition-colors hover:bg-zinc-900/40"
        aria-expanded={expanded}
      >
        <ForgeGameCard
          game={game}
          variant="row"
          badges={timelineBadges(timeline)}
          linkTitle={false}
          showActions={false}
          className="border-0 bg-transparent"
          trailing={
            <span aria-hidden="true" className="pt-1 text-zinc-600">
              {expanded ? "▼" : "▶"}
            </span>
          }
        />
      </div>

      {expanded ? (
        <div className="border-t border-zinc-800/80 px-4 py-3">
          {timeline.events.length === 0 ? (
            <p className="text-sm text-zinc-600">
              次にプレイすると、版ごとの履歴がここに残ります。
            </p>
          ) : (
            <ol className="space-y-3">
              {timeline.events.map((event) => (
                <li key={event.id} className="flex gap-3 text-sm">
                  <time
                    dateTime={event.occurredAt}
                    className="w-24 shrink-0 text-xs text-zinc-600"
                  >
                    {formatPlayHistoryDate(event.occurredAt)}
                  </time>
                  <span className="min-w-0 leading-relaxed text-zinc-300">
                    {event.label}
                  </span>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
            <CreatorLink name={game.creator} />
            <PlayTypeLabel playUrl={game.playUrl} />
          </div>

          <Link
            href={`/games/${game.id}`}
            className="mt-3 inline-flex text-xs font-medium text-orange-400 transition-colors hover:text-orange-300"
          >
            作品を見る →
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function PlayHistorySection() {
  const { timelines, loaded, error, hasPlayedProjects } = usePlayerPlayHistory();

  const preview = useMemo(() => timelines.slice(0, 2), [timelines]);

  if (!loaded) {
    return (
      <section
        id="play-history"
        className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 scroll-mt-24"
      >
        <div className="border-l-2 border-sky-500 pl-3">
          <h2 className="text-base font-semibold tracking-tight text-zinc-100">
            プレイ履歴
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            読み込み中…
          </p>
        </div>
      </section>
    );
  }

  if (!hasPlayedProjects) {
    return (
      <section
        id="play-history"
        className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 scroll-mt-24"
      >
        <div className="border-l-2 border-sky-500 pl-3">
          <h2 className="text-base font-semibold tracking-tight text-zinc-100">
            プレイ履歴
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            プレイした作品との関わり方が、作品ごとにまとまります。
          </p>
        </div>
        <p className="mt-4 text-sm text-zinc-600">まだプレイ履歴がありません。</p>
      </section>
    );
  }

  return (
    <section
      id="play-history"
      className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 scroll-mt-24"
    >
      <div className="border-l-2 border-sky-500 pl-3">
        <h2 className="text-base font-semibold tracking-tight text-zinc-100">
          プレイ履歴
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          閉じた状態では関わり方、開くと版ごとの履歴が時系列で見られます。
        </p>
      </div>

      {error ? <p className="mt-4 text-sm text-red-400/90">{error}</p> : null}

      <div className="mt-4 space-y-3">
        {(timelines.length <= 2 ? timelines : preview).map((timeline, index) => (
          <PlayHistoryProjectCard
            key={timeline.projectId}
            timeline={timeline}
            defaultExpanded={index === 0}
          />
        ))}
      </div>

      {timelines.length > 2 ? (
        <details className="mt-4 rounded-lg border border-zinc-800/80 bg-zinc-950/20 px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-zinc-300">
            ほか {timelines.length - 2} 作品の履歴を見る
          </summary>
          <div className="mt-3 space-y-3">
            {timelines.slice(2).map((timeline) => (
              <PlayHistoryProjectCard
                key={timeline.projectId}
                timeline={timeline}
                defaultExpanded={false}
              />
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}
