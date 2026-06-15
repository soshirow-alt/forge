"use client";

import { useEffect, useState } from "react";
import { useGames } from "@/components/games-provider";
import type { ProjectVoiceNurtureSignal } from "@/lib/project-voice-nurture";

export function useOwnedProjectVoiceSignals(userId: string | undefined) {
  const { getOwnedProjectVoiceSignals } = useGames();
  const [signals, setSignals] = useState<ProjectVoiceNurtureSignal[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) {
      setSignals([]);
      setLoaded(true);
      return;
    }

    let active = true;
    setLoaded(false);

    void getOwnedProjectVoiceSignals(userId)
      .then((result) => {
        if (active) {
          setSignals(result);
        }
      })
      .catch(() => {
        if (active) {
          setSignals([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, [getOwnedProjectVoiceSignals, userId]);

  return { signals, loaded };
}
