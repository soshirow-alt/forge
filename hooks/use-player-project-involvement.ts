"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  buildPlayerProjectInvolvement,
  type PlayerProjectInvolvement,
} from "@/lib/player-project-involvement";
import { resolvePlayableVersion } from "@/lib/playable-version";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import {
  fetchPlaySessionsForProject,
  fetchProjectPlayFirstSeenForProject,
  isPlaySessionsTableMissingError,
} from "@/lib/supabase/play-sessions-db";
import { fetchUserFeedbackForProject } from "@/lib/supabase/user-engagement";
import { fetchUserVoiceResponsesForProjects } from "@/lib/supabase/voice-engagement";

export function usePlayerProjectInvolvement(input: {
  projectId: string | null;
  playableVersion: string | null | undefined;
  watching: boolean;
  enabled: boolean;
}) {
  const { user, hydrated } = useAuth();
  const [involvement, setInvolvement] = useState<PlayerProjectInvolvement | null>(
    null,
  );
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    if (!input.enabled || !input.projectId || !user) {
      setInvolvement(null);
      setLoaded(true);
      return;
    }

    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      setInvolvement(null);
      setLoaded(true);
      return;
    }

    const projectId = input.projectId;
    const playableVersion = resolvePlayableVersion(input.playableVersion);

    try {
      const [sessions, firstPlayedAtFromPlays, voices, feedback] =
        await Promise.all([
          fetchPlaySessionsForProject(supabase, user.id, projectId),
          fetchProjectPlayFirstSeenForProject(supabase, user.id, projectId),
          fetchUserVoiceResponsesForProjects(supabase, user.id, [projectId]),
          fetchUserFeedbackForProject(supabase, user.id, projectId),
        ]);

      setInvolvement(
        buildPlayerProjectInvolvement({
          sessions,
          firstPlayedAtFromPlays,
          voices,
          feedback,
          watching: input.watching,
          playableVersion,
        }),
      );
    } catch (error) {
      if (isPlaySessionsTableMissingError(error)) {
        setInvolvement(
          buildPlayerProjectInvolvement({
            sessions: [],
            firstPlayedAtFromPlays: null,
            voices: [],
            feedback: [],
            watching: input.watching,
            playableVersion,
          }),
        );
      } else {
        setInvolvement(null);
      }
    } finally {
      setLoaded(true);
    }
  }, [
    input.enabled,
    input.projectId,
    input.playableVersion,
    input.watching,
    user,
  ]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    setLoaded(false);
    void reload();
  }, [hydrated, reload]);

  return {
    involvement,
    loaded: hydrated && loaded,
    reload,
  };
}
