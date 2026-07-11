"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import { resolvePlayableVersion } from "@/lib/playable-version";
import type { StudioHomeHighlights } from "@/lib/studio-home-metrics";
import { fetchStudioHomeHighlights } from "@/lib/supabase/studio-home-metrics-db";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";

const EMPTY_HIGHLIGHTS: StudioHomeHighlights = {
  unreadVoiceProjectCount: 0,
  hasRecentCommunityReply: false,
};

export function useStudioHomeHighlights() {
  const { user } = useAuth();
  const { getOwnedProjects } = useGames();
  const [highlights, setHighlights] = useState<StudioHomeHighlights>(EMPTY_HIGHLIGHTS);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  const publicProjects = useMemo(() => {
    if (!user) {
      return [];
    }
    return getOwnedProjects(user.id)
      .filter((game) => game.visibility === "public")
      .map((game) => ({
        projectId: game.id,
        playableVersion: resolvePlayableVersion(game.playableVersion),
      }));
  }, [getOwnedProjects, user]);

  useEffect(() => {
    if (!user) {
      hasLoadedRef.current = false;
      return;
    }

    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      return;
    }

    let active = true;
    const blocking = !hasLoadedRef.current;

    queueMicrotask(() => {
      if (!active) {
        return;
      }
      if (blocking) {
        setLoading(true);
      }
    });

    void fetchStudioHomeHighlights(supabase, user.id, publicProjects)
      .then((result) => {
        if (active) {
          setHighlights(result);
          hasLoadedRef.current = true;
        }
      })
      .catch(() => {
        if (active && blocking) {
          setHighlights(EMPTY_HIGHLIGHTS);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [publicProjects, user]);

  return {
    highlights: user ? highlights : EMPTY_HIGHLIGHTS,
    loading: user ? (getOptionalSupabaseClient() ? loading : false) : false,
  };
}
