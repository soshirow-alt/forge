"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import {
  buildPlayHistoryForProjects,
  type PlayHistoryProjectTimeline,
} from "@/lib/player-play-timeline";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import { fetchProjectDevlogsForProjects } from "@/lib/supabase/project-devlogs";
import { fetchReleaseEventsForProjects } from "@/lib/supabase/project-release-events-db";
import {
  fetchPlaySessionsForUser,
  fetchProjectPlayFirstSeen,
  isPlaySessionsTableMissingError,
} from "@/lib/supabase/play-sessions-db";
import { fetchUserVoiceResponsesForProjects } from "@/lib/supabase/voice-engagement";
import { fetchWitnessGrantsForUser } from "@/lib/supabase/witness-grants-db";

export function usePlayerPlayHistory() {
  const { user, hydrated } = useAuth();
  const { getGameById, getPlayedGames } = useGames();
  const [timelines, setTimelines] = useState<PlayHistoryProjectTimeline[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const playedIdsKey = getPlayedGames()
    .map((game) => game.id)
    .join("|");

  const reload = useCallback(async () => {
    if (!user) {
      setTimelines([]);
      setLoaded(true);
      setError(null);
      return;
    }

    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      setTimelines([]);
      setLoaded(true);
      setError(null);
      return;
    }

    const playedProjectIdsList = getPlayedGames().map((game) => game.id);
    if (playedProjectIdsList.length === 0) {
      setTimelines([]);
      setLoaded(true);
      setError(null);
      return;
    }

    try {
      const [sessions, firstSeenRows, voices, devlogs, releaseEvents, witnessGrants] =
        await Promise.all([
        fetchPlaySessionsForUser(supabase, user.id),
        fetchProjectPlayFirstSeen(supabase, user.id),
        fetchUserVoiceResponsesForProjects(supabase, user.id, playedProjectIdsList),
        fetchProjectDevlogsForProjects(supabase, playedProjectIdsList),
        fetchReleaseEventsForProjects(supabase, playedProjectIdsList),
        fetchWitnessGrantsForUser(supabase, user.id),
      ]);

      const firstPlayedByProject = new Map(
        firstSeenRows.map((row) => [row.projectId, row.firstPlayedAt]),
      );

      const witnessGrantProjectIds = new Set(
        witnessGrants.map((grant) => grant.projectId),
      );

      const built = buildPlayHistoryForProjects({
        playedProjectIds: playedProjectIdsList,
        firstPlayedByProject,
        sessions: sessions.filter((session) =>
          playedProjectIdsList.includes(session.projectId),
        ),
        voices,
        devlogs,
        releaseEvents,
        witnessGrantProjectIds,
        getPlayableVersion: (projectId) => getGameById(projectId)?.playableVersion,
      }).filter((timeline) => getGameById(timeline.projectId));

      setTimelines(built);
      setError(null);
    } catch (caught) {
      if (isPlaySessionsTableMissingError(caught)) {
        setTimelines([]);
        setError(null);
      } else {
        setError("プレイ履歴の読み込みに失敗しました。");
        setTimelines([]);
      }
    } finally {
      setLoaded(true);
    }
  }, [getGameById, getPlayedGames, user]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    setLoaded(false);
    void reload();
  }, [hydrated, reload, playedIdsKey]);

  return {
    timelines,
    loaded,
    error,
    reload,
    hasPlayedProjects: playedIdsKey.length > 0,
  };
}
