"use client";

import { useEffect, useState } from "react";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import {
  fetchProjectPublicStats,
  type ProjectPublicStats,
} from "@/lib/supabase/project-public-stats-db";

const EMPTY_STATS: ProjectPublicStats = {
  feedbackParticipantCount: 0,
  watchCount: 0,
  witnessGrantCount: 0,
  latestDevlogAt: null,
};

export function useProjectPublicStats(projectId: string | null | undefined) {
  const [stats, setStats] = useState<ProjectPublicStats>(EMPTY_STATS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setStats(EMPTY_STATS);
      setLoaded(false);
      return;
    }

    let cancelled = false;
    setLoaded(false);

    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      setStats(EMPTY_STATS);
      setLoaded(true);
      return;
    }

    void fetchProjectPublicStats(supabase, projectId)
      .then((next) => {
        if (!cancelled) {
          setStats(next);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStats(EMPTY_STATS);
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return { stats, loaded };
}
