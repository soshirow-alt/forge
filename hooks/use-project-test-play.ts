"use client";

import { useCallback, useMemo, useState } from "react";
import { useGames } from "@/components/games-provider";
import {
  resolvePlayDestinations,
  type PlayDestination,
} from "@/lib/game-play-destinations";

export function useProjectTestPlay(projectId: string) {
  const { getSubmittedGameById, recordPlay } = useGames();
  const submittedGame = getSubmittedGameById(projectId);
  const [playDestinationPickerOpen, setPlayDestinationPickerOpen] = useState(false);

  const playDestinations = useMemo(
    () => resolvePlayDestinations(submittedGame),
    [submittedGame],
  );

  const hasPlayUrl = Boolean(submittedGame?.playUrl?.trim());

  const navigateToPlayDestination = useCallback(
    async (url: string) => {
      await recordPlay(projectId);
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [projectId, recordPlay],
  );

  const handleTestPlay = useCallback(() => {
    const destinations =
      playDestinations.length > 0
        ? playDestinations
        : submittedGame?.playUrl
          ? [
              {
                label: "外部サイト",
                url: submittedGame.playUrl,
                actionLabel: "外部サイトで開く",
              } satisfies PlayDestination,
            ]
          : [];

    if (destinations.length === 0) {
      return;
    }

    if (destinations.length === 1) {
      void navigateToPlayDestination(destinations[0].url);
      return;
    }

    setPlayDestinationPickerOpen(true);
  }, [navigateToPlayDestination, playDestinations, submittedGame?.playUrl]);

  const handlePlayDestinationSelect = useCallback(
    async (destination: PlayDestination) => {
      setPlayDestinationPickerOpen(false);
      await navigateToPlayDestination(destination.url);
    },
    [navigateToPlayDestination],
  );

  return {
    playDestinations,
    playDestinationPickerOpen,
    setPlayDestinationPickerOpen,
    hasPlayUrl,
    handleTestPlay,
    handlePlayDestinationSelect,
  };
}
