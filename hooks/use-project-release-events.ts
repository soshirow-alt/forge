"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import type { ProjectReleaseEvent } from "@/lib/project-release-state";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import {
  fetchReleaseEventsForProject,
  isReleaseEventsTableMissingError,
} from "@/lib/supabase/project-release-events-db";

export function useProjectReleaseEvents(projectId: string) {
  const { user, hydrated } = useAuth();
  const { getSubmittedGameById, declareProjectReleased, declareProjectReleaseReopened } =
    useGames();
  const [events, setEvents] = useState<ProjectReleaseEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const game = getSubmittedGameById(projectId);

  const reload = useCallback(async () => {
    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      setEvents([]);
      setLoaded(true);
      return;
    }

    try {
      const rows = await fetchReleaseEventsForProject(supabase, projectId);
      setEvents(rows);
      setError(null);
    } catch (caught) {
      if (isReleaseEventsTableMissingError(caught)) {
        setEvents([]);
        setError(null);
      } else {
        setEvents([]);
        setError("正式ver情報の読み込みに失敗しました。");
      }
    } finally {
      setLoaded(true);
    }
  }, [projectId]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    setLoaded(false);
    void reload();
  }, [hydrated, reload]);

  const declareReleased = useCallback(
    async (note?: string) => {
      if (!user) {
        throw new Error("Login required");
      }

      setBusy(true);
      setError(null);
      try {
        await declareProjectReleased(projectId, note);
        await reload();
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : "正式ver宣言に失敗しました。";
        setError(message);
        throw caught;
      } finally {
        setBusy(false);
      }
    },
    [declareProjectReleased, projectId, reload, user],
  );

  const declareReleaseReopened = useCallback(
    async (note?: string) => {
      if (!user) {
        throw new Error("Login required");
      }

      setBusy(true);
      setError(null);
      try {
        await declareProjectReleaseReopened(projectId, note);
        await reload();
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : "再調整の開始に失敗しました。";
        setError(message);
        throw caught;
      } finally {
        setBusy(false);
      }
    },
    [declareProjectReleaseReopened, projectId, reload, user],
  );

  return {
    events,
    loaded,
    busy,
    error,
    releaseStatus: game?.releaseStatus ?? "in_development",
    declareReleased,
    declareReleaseReopened,
    reload,
  };
}
