"use client";

import { useMemo } from "react";
import { useGames } from "@/components/games-provider";
import {
  getFirstReleasedEvent,
  hasEverReachedOfficialRelease,
  RELEASE_STATUS_LABELS,
  type ProjectReleaseEvent,
  type ProjectReleaseStatus,
} from "@/lib/project-release-state";
import { formatPlayHistoryDate } from "@/lib/player-play-timeline";
import type { Game } from "@/lib/mock-games";

export type PlayerOfficialReleaseItem = {
  projectId: string;
  game: Game;
  currentStatus: ProjectReleaseStatus;
  firstReleasedAt: string | null;
  firstReleasedLabel: string | null;
  eventCount: number;
  events: ProjectReleaseEvent[];
};

export function usePlayerOfficialReleases() {
  const { getPlayedGames, getReleaseEventsForProject, getGameById } = useGames();

  const items = useMemo(() => {
    const playedGames = getPlayedGames();
    const results: PlayerOfficialReleaseItem[] = [];

    for (const game of playedGames) {
      const events = getReleaseEventsForProject(game.id);
      if (!hasEverReachedOfficialRelease(events)) {
        continue;
      }

      const resolvedGame = getGameById(game.id) ?? game;
      const firstReleased = getFirstReleasedEvent(events);

      results.push({
        projectId: game.id,
        game: resolvedGame,
        currentStatus: resolvedGame.releaseStatus ?? "in_development",
        firstReleasedAt: firstReleased?.createdAt ?? null,
        firstReleasedLabel: firstReleased
          ? formatPlayHistoryDate(firstReleased.createdAt)
          : null,
        eventCount: events.length,
        events,
      });
    }

    return results.sort((left, right) => {
      const leftTime = left.firstReleasedAt
        ? new Date(left.firstReleasedAt).getTime()
        : 0;
      const rightTime = right.firstReleasedAt
        ? new Date(right.firstReleasedAt).getTime()
        : 0;
      return rightTime - leftTime;
    });
  }, [getGameById, getPlayedGames, getReleaseEventsForProject]);

  return {
    items,
    statusLabel: RELEASE_STATUS_LABELS,
  };
}
