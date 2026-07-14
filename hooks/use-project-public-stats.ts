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
  playPlayerCount: null,
};

export function useProjectPublicStats(projectId: string | null | undefined) {
  const [stats, setStats] = useState<ProjectPublicStats>(EMPTY_STATS);
  const [loaded, setLoaded] = useState(false);
  /** true = 取得失敗またはクライアント不可。実データの 0 とは区別する */
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setStats(EMPTY_STATS);
      setLoaded(false);
      setError(false);
      return;
    }

    let cancelled = false;
    setLoaded(false);
    setError(false);

    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      setStats(EMPTY_STATS);
      setLoaded(true);
      setError(true);
      return;
    }

    void fetchProjectPublicStats(supabase, projectId)
      .then((next) => {
        if (!cancelled) {
          setStats(next);
          setLoaded(true);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStats(EMPTY_STATS);
          setLoaded(true);
          setError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return { stats, loaded, error };
}
