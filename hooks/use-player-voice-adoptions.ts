"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import {
  fetchActiveAdoptionsForUser,
  insertAdoptionDispute,
  isVoiceAdoptionsTableMissingError,
} from "@/lib/supabase/voice-adoptions-db";
import {
  countFixtureAdoptionsForDevlog,
  disputeFixtureAdoption,
  ensureFixtureSeededForUser,
  getFixtureProjectTitle,
  isFixtureStorageActive,
  listFixtureAdoptionsForUser,
} from "@/lib/voice-adoption/fixture-store";
import { isVoiceAdoptionPlayerVisible } from "@/lib/voice-adoption/constants";
import { countActiveAdoptionsForDevlog } from "@/lib/supabase/voice-adoptions-db";
import type { VoiceAdoptionWithProject } from "@/lib/voice-adoption/types";
import { useGames } from "@/components/games-provider";
import { FIXTURE_DEVLOG, FIXTURE_PROJECT_TITLE } from "@/lib/voice-adoption/fixture-data";

function enrichAdoptions(
  rows: ReturnType<typeof listFixtureAdoptionsForUser>,
  getGameById: (id: string) => { title: string } | undefined,
): VoiceAdoptionWithProject[] {
  return rows.map((row) => {
    const fixtureTitle = getFixtureProjectTitle(row.projectId);
    const game = getGameById(row.projectId);

    return {
      ...row,
      projectTitle: fixtureTitle ?? game?.title ?? row.projectId,
    };
  });
}

export function usePlayerVoiceAdoptions(projectId?: string) {
  const { user, hydrated } = useAuth();
  const { getGameById } = useGames();
  const [adoptions, setAdoptions] = useState<VoiceAdoptionWithProject[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [usingFixture, setUsingFixture] = useState(false);

  const reload = useCallback(async () => {
    if (!user) {
      setAdoptions([]);
      setLoaded(true);
      return;
    }

    if (isFixtureStorageActive()) {
      const rows = ensureFixtureSeededForUser(user.id);
      const filtered = projectId
        ? rows.filter((row) => row.projectId === projectId)
        : rows;
      setAdoptions(enrichAdoptions(filtered, getGameById));
      setUsingFixture(true);
      setLoaded(true);
      return;
    }

    if (!isVoiceAdoptionPlayerVisible()) {
      setAdoptions([]);
      setUsingFixture(false);
      setLoaded(true);
      return;
    }

    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      setAdoptions([]);
      setLoaded(true);
      return;
    }

    try {
      const rows = await fetchActiveAdoptionsForUser(supabase, user.id, projectId);
      setAdoptions(enrichAdoptions(rows, getGameById));
      setUsingFixture(false);
    } catch (error) {
      if (isVoiceAdoptionsTableMissingError(error)) {
        setAdoptions([]);
      } else {
        console.error(error);
        setAdoptions([]);
      }
    } finally {
      setLoaded(true);
    }
  }, [getGameById, projectId, user]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void reload();
  }, [hydrated, reload]);

  const disputeAdoption = useCallback(
    async (adoptionId: string) => {
      if (!user) {
        return false;
      }

      if (usingFixture || isFixtureStorageActive()) {
        const ok = disputeFixtureAdoption(user.id, adoptionId);
        if (ok) {
          await reload();
        }
        return ok;
      }

      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return false;
      }

      try {
        await insertAdoptionDispute(supabase, user.id, adoptionId);
        await reload();
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
    [reload, user, usingFixture],
  );

  return {
    adoptions,
    loaded,
    usingFixture,
    disputeAdoption,
    reload,
    fixtureReplayProjectId: usingFixture ? FIXTURE_DEVLOG.projectId : null,
    fixtureProjectTitle: FIXTURE_PROJECT_TITLE,
  };
}

export function useDevlogAdoptionCount(devlogId: string | null | undefined) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!devlogId) {
      setCount(null);
      return;
    }

    if (isFixtureStorageActive()) {
      setCount(countFixtureAdoptionsForDevlog(devlogId));
      return;
    }

    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      setCount(null);
      return;
    }

    void countActiveAdoptionsForDevlog(supabase, devlogId)
      .then(setCount)
      .catch(() => setCount(null));
  }, [devlogId]);

  return count;
}

export function useStudioAdoptionCount(
  gameId: string,
  latestPublishedDevlogId?: string,
) {
  const devlogId =
    isFixtureStorageActive() && gameId === FIXTURE_DEVLOG.projectId
      ? FIXTURE_DEVLOG.id
      : latestPublishedDevlogId;

  return useDevlogAdoptionCount(devlogId);
}
