"use client";

import { useCallback, useMemo, useState } from "react";
import { useGames } from "@/components/games-provider";
import {
  openExternalPlayUrl,
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
    (url: string) => {
      // await せず同期で開く（recordPlay 待ちだと popup blocker で無反応になる）
      openExternalPlayUrl(url);
      void recordPlay(projectId).catch(() => undefined);
    },
    [projectId, recordPlay],
  );

  const handleTestPlay = useCallback(() => {
    const playUrl = submittedGame?.playUrl?.trim();
    if (playUrl) {
      navigateToPlayDestination(playUrl);
      return;
    }

    const destinations =
      playDestinations.length > 0
        ? playDestinations
        : [];

    if (destinations.length === 0) {
      return;
    }

    if (destinations.length === 1) {
      navigateToPlayDestination(destinations[0].url);
      return;
    }

    setPlayDestinationPickerOpen(true);
  }, [navigateToPlayDestination, playDestinations, submittedGame?.playUrl]);

  const handlePlayDestinationSelect = useCallback(
    (destination: PlayDestination) => {
      setPlayDestinationPickerOpen(false);
      navigateToPlayDestination(destination.url);
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
