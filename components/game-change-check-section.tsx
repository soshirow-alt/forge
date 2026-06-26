"use client";

import { useEffect, useState } from "react";
import { GameChangeCheckCard } from "@/components/game-change-check-card";
import { useGames } from "@/components/games-provider";
import type { ChangeCheckState } from "@/lib/change-check-types";
import { GAME_PROJECT_HISTORY_SECTION_ID } from "@/lib/project-nurture-links";
import { resolvePlayableVersion } from "@/lib/playable-version";

type GameChangeCheckSectionProps = {
  gameId: string;
  playableVersion: string | undefined;
  onTryVersion: () => void;
  onViewUpdate?: () => void;
};

export function GameChangeCheckSection({
  gameId,
  playableVersion,
  onTryVersion,
  onViewUpdate,
}: GameChangeCheckSectionProps) {
  const { getChangeCheckState } = useGames();
  const [state, setState] = useState<ChangeCheckState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const currentVersion = resolvePlayableVersion(playableVersion);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);

    void getChangeCheckState(gameId).then((next) => {
      if (!cancelled) {
        setState(next);
        setLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [gameId, getChangeCheckState]);

  if (!loaded || !state) {
    return null;
  }

  function handleViewUpdate() {
    if (onViewUpdate) {
      onViewUpdate();
      return;
    }
    const element = document.getElementById(GAME_PROJECT_HISTORY_SECTION_ID);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mt-4">
      <GameChangeCheckCard
        state={state}
        currentVersion={currentVersion}
        onViewUpdate={handleViewUpdate}
        onTryVersion={onTryVersion}
      />
    </div>
  );
}
