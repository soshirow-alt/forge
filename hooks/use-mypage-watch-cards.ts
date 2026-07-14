"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import { fetchPlaySessionsForUser } from "@/lib/supabase/play-sessions-db";
import { fetchMeaningfulUpdateByProjectIds } from "@/lib/supabase/meaningful-update-signals-db";
import { fetchActiveAdoptionsForUser } from "@/lib/supabase/voice-adoptions-db";
import { isVoiceAdoptionPlayerVisible } from "@/lib/voice-adoption/constants";
import type { VoiceAdoptionRow } from "@/lib/voice-adoption/types";
import {
  buildMypageWatchCards,
  type MypageWatchCardModel,
} from "@/lib/mypage-watch-cards";
import type { MeaningfulUpdateByProject } from "@/lib/meaningful-update-signals";
import type { ProjectPlaySession } from "@/lib/supabase/play-sessions-db";

export function useMypageWatchCards(): {
  cards: MypageWatchCardModel[];
  loading: boolean;
  includeFbFilter: boolean;
} {
  const { user } = useAuth();
  const { getWatchedGames } = useGames();
  const watchedGames = getWatchedGames();
  const includeFbFilter = isVoiceAdoptionPlayerVisible();

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ProjectPlaySession[]>([]);
  const [meaningfulByProject, setMeaningfulByProject] = useState(
    () => new Map<string, MeaningfulUpdateByProject>(),
  );
  const [adoptionsByProject, setAdoptionsByProject] = useState(
    () => new Map<string, VoiceAdoptionRow>(),
  );

  const projectIdsKey = useMemo(
    () =>
      watchedGames
        .map((game) => game.id)
        .sort()
        .join(","),
    [watchedGames],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const supabase = getOptionalSupabaseClient();
      const ids = projectIdsKey ? projectIdsKey.split(",") : [];

      if (!supabase || !user?.id || ids.length === 0) {
        if (!cancelled) {
          setSessions([]);
          setMeaningfulByProject(new Map());
          setAdoptionsByProject(new Map());
          setLoading(false);
        }
        return;
      }

      try {
        const [nextSessions, nextMeaningful, nextAdoptions] = await Promise.all([
          fetchPlaySessionsForUser(supabase, user.id),
          fetchMeaningfulUpdateByProjectIds(supabase, ids),
          includeFbFilter
            ? fetchActiveAdoptionsForUser(supabase, user.id)
            : Promise.resolve([] as VoiceAdoptionRow[]),
        ]);

        if (cancelled) {
          return;
        }

        const adoptionMap = new Map<string, VoiceAdoptionRow>();
        for (const adoption of nextAdoptions) {
          if (ids.includes(adoption.projectId) && !adoptionMap.has(adoption.projectId)) {
            adoptionMap.set(adoption.projectId, adoption);
          }
        }

        setSessions(nextSessions);
        setMeaningfulByProject(nextMeaningful);
        setAdoptionsByProject(adoptionMap);
      } catch {
        if (!cancelled) {
          setSessions([]);
          setMeaningfulByProject(new Map());
          setAdoptionsByProject(new Map());
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id, projectIdsKey, includeFbFilter]);

  const cards = useMemo(
    () =>
      buildMypageWatchCards({
        watchedGames,
        sessions,
        meaningfulByProject,
        adoptionsByProject,
      }),
    [watchedGames, sessions, meaningfulByProject, adoptionsByProject],
  );

  return { cards, loading, includeFbFilter };
}
