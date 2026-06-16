"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import { formatPlayHistoryDate } from "@/lib/player-play-timeline";
import type { Game } from "@/lib/mock-games";
import {
  fetchWitnessGrantsForUser,
  isWitnessGrantsTableMissingError,
  type ProjectWitnessGrant,
} from "@/lib/supabase/witness-grants-db";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import { WITNESS_GRANT_PATH_PLAYER_LABELS } from "@/lib/witness-grants-display";
import type { WitnessGrantPath } from "@/lib/witness-eligibility";

export type PlayerWitnessGrantItem = {
  projectId: string;
  game: Game;
  grantPath: WitnessGrantPath;
  grantPathLabel: string;
  firstReleasedAt: string;
  firstReleasedLabel: string;
  grantedAt: string;
  grantedLabel: string;
  grant: ProjectWitnessGrant;
};

export function usePlayerWitnessGrants() {
  const { user, hydrated } = useAuth();
  const { getGameById } = useGames();
  const [grants, setGrants] = useState<ProjectWitnessGrant[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) {
      setGrants([]);
      setLoaded(true);
      setError(null);
      return;
    }

    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      setGrants([]);
      setLoaded(true);
      setError(null);
      return;
    }

    try {
      const rows = await fetchWitnessGrantsForUser(supabase, user.id);
      setGrants(rows);
      setError(null);
    } catch (unknownError) {
      if (isWitnessGrantsTableMissingError(unknownError)) {
        setGrants([]);
        setError(null);
      } else {
        setGrants([]);
        setError("見届け人の読み込みに失敗しました。");
      }
    } finally {
      setLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void reload();
  }, [hydrated, reload]);

  const grantByProjectId = useMemo(
    () => new Map(grants.map((grant) => [grant.projectId, grant])),
    [grants],
  );

  const items = useMemo<PlayerWitnessGrantItem[]>(() => {
    const results: PlayerWitnessGrantItem[] = [];

    for (const grant of grants) {
      const game = getGameById(grant.projectId);
      if (!game) {
        continue;
      }

      results.push({
        projectId: grant.projectId,
        game,
        grantPath: grant.grantPath,
        grantPathLabel: WITNESS_GRANT_PATH_PLAYER_LABELS[grant.grantPath],
        firstReleasedAt: grant.firstReleasedAt,
        firstReleasedLabel: formatPlayHistoryDate(grant.firstReleasedAt),
        grantedAt: grant.grantedAt,
        grantedLabel: formatPlayHistoryDate(grant.grantedAt),
        grant,
      });
    }

    return results.sort(
      (left, right) =>
        new Date(right.grantedAt).getTime() - new Date(left.grantedAt).getTime(),
    );
  }, [getGameById, grants]);

  return {
    grants,
    grantByProjectId,
    items,
    loaded,
    error,
    reload,
  };
}
