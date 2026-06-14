"use client";

import { useEffect, useState } from "react";
import { useGames } from "@/components/games-provider";
import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";

export function useOwnedProjectFeedback(userId: string | undefined) {
  const { getOwnedProjectFeedback } = useGames();
  const [entries, setEntries] = useState<ProjectFeedbackEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) {
      setEntries([]);
      setLoaded(true);
      return;
    }

    let active = true;
    setLoaded(false);

    void getOwnedProjectFeedback(userId)
      .then((result) => {
        if (active) {
          setEntries(result);
        }
      })
      .catch(() => {
        if (active) {
          setEntries([]);
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
  }, [getOwnedProjectFeedback, userId]);

  return { entries, loaded };
}
