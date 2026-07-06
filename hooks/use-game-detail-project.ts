"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import { mergeGameWithExtras } from "@/lib/game-extra-storage";
import {
  forgePerfMark,
  forgePerfMeasure,
  forgePerfTimed,
} from "@/lib/forge-perf-log";
import type { Game } from "@/lib/mock-games";
import { useHideV0MockContent } from "@/lib/forge-deployment-context";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import {
  fetchOwnedProjectById,
  fetchPublicProjectById,
} from "@/lib/supabase/projects";
import { isSupabaseProjectId } from "@/lib/submitted-game-v0-adapter";

export type GameDetailProjectResult = {
  game: Game | null;
  loaded: boolean;
  notFound: boolean;
  isOwner: boolean;
  isRealProject: boolean;
};

const MOCK_READY: GameDetailProjectResult = {
  game: null,
  loaded: true,
  notFound: false,
  isOwner: false,
  isRealProject: false,
};

export function useGameDetailProject(id: string): GameDetailProjectResult {
  const { user } = useAuth();
  const hideV0Mock = useHideV0MockContent();
  const { upsertGameDetailProject } = useGames();
  const isPublicProjectId = isSupabaseProjectId(id);
  const [state, setState] = useState<GameDetailProjectResult>(() =>
    isPublicProjectId
      ? {
          game: null,
          loaded: false,
          notFound: false,
          isOwner: false,
          isRealProject: true,
        }
      : MOCK_READY,
  );

  useEffect(() => {
    if (!isPublicProjectId) {
      setState(MOCK_READY);
      return;
    }

    let cancelled = false;
    const mark = `game-detail-fetch:${id}:${Date.now()}`;
    forgePerfMark(mark);

    async function load() {
      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        if (!cancelled) {
          setState({
            game: null,
            loaded: true,
            notFound: hideV0Mock,
            isOwner: false,
            isRealProject: true,
          });
        }
        return;
      }

      const [publicGame, ownedGame] = await Promise.all([
        forgePerfTimed("supabase.fetchPublicProjectById", () =>
          fetchPublicProjectById(supabase, id),
        ),
        user?.id
          ? forgePerfTimed("supabase.fetchOwnedProjectById", () =>
              fetchOwnedProjectById(supabase, id, user.id),
            )
          : Promise.resolve(null),
      ]);

      if (cancelled) {
        return;
      }

      const isOwner = Boolean(ownedGame);
      const resolved = ownedGame ?? publicGame;
      const game = resolved ? mergeGameWithExtras(resolved) : null;

      if (game) {
        upsertGameDetailProject(game, isOwner ? "owned" : "public");
      }

      forgePerfMeasure("game-detail.projectReady", mark, {
        id,
        hasPublic: Boolean(publicGame),
        hasOwned: Boolean(ownedGame),
        userId: user?.id ?? null,
      });

      setState({
        game,
        loaded: true,
        notFound: hideV0Mock && !game,
        isOwner,
        isRealProject: Boolean(game),
      });
    }

    setState({
      game: null,
      loaded: false,
      notFound: false,
      isOwner: false,
      isRealProject: true,
    });
    void load();

    return () => {
      cancelled = true;
    };
  }, [hideV0Mock, id, isPublicProjectId, upsertGameDetailProject, user?.id]);

  return state;
}
