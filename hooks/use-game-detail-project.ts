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
  fetchPublicProjectGalleryPaths,
  isOwnedPublicOrPrivateProject,
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
      queueMicrotask(() => {
        setState(MOCK_READY);
      });
      return;
    }

    let cancelled = false;
    const mark = `game-detail-fetch:${id}:${Date.now()}`;
    forgePerfMark(mark);

    async function load() {
      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        if (!cancelled) {
          queueMicrotask(() => {
            if (cancelled) return;
            setState({
              game: null,
              loaded: true,
              notFound: hideV0Mock,
              isOwner: false,
              isRealProject: true,
            });
          });
        }
        return;
      }

      let publicGame: Game | null = null;
      let isOwner = false;
      let ownedGame: Game | null = null;

      if (user?.id) {
        const [publicResult, ownedFlag] = await Promise.all([
          forgePerfTimed("supabase.fetchPublicProjectById", () =>
            fetchPublicProjectById(supabase, id),
          ),
          forgePerfTimed("supabase.isOwnedPublicOrPrivateProject", () =>
            isOwnedPublicOrPrivateProject(supabase, id, user.id),
          ),
        ]);
        publicGame = publicResult;
        isOwner = ownedFlag;
        if (!publicGame && isOwner) {
          ownedGame = await forgePerfTimed(
            "supabase.fetchOwnedProjectById",
            () => fetchOwnedProjectById(supabase, id, user.id),
          );
        }
      } else {
        publicGame = await forgePerfTimed(
          "supabase.fetchPublicProjectById",
          () => fetchPublicProjectById(supabase, id),
        );
      }

      if (cancelled) {
        return;
      }

      const resolved = publicGame ?? ownedGame;
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

      queueMicrotask(() => {
        if (cancelled) return;
        setState({
          game,
          loaded: true,
          notFound: hideV0Mock && !game,
          isOwner,
          isRealProject: Boolean(game),
        });
      });

      // Count RPC in parallel with first image request (Fix A). Public only.
      if (!publicGame || !game) {
        return;
      }

      void (async () => {
        const paths = await forgePerfTimed(
          "supabase.fetchPublicProjectGalleryPaths",
          () => fetchPublicProjectGalleryPaths(supabase, id),
        );
        if (cancelled || paths === null) {
          // Keep index-0 path on count failure.
          return;
        }

        const enriched: Game = {
          ...game,
          thumbnailUrl: paths[0],
          thumbnailUrls: paths,
        };
        const merged = mergeGameWithExtras(enriched);
        upsertGameDetailProject(merged, isOwner ? "owned" : "public");
        if (!cancelled) {
          queueMicrotask(() => {
            if (cancelled) return;
            setState((prev) => ({
              ...prev,
              game: merged,
            }));
          });
        }
      })();
    }

    queueMicrotask(() => {
      if (cancelled) return;
      setState({
        game: null,
        loaded: false,
        notFound: false,
        isOwner: false,
        isRealProject: true,
      });
    });
    void load();

    return () => {
      cancelled = true;
    };
  }, [hideV0Mock, id, isPublicProjectId, upsertGameDetailProject, user?.id]);

  return state;
}
