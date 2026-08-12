import { FORGE_PUBLIC_SOFT_CACHE_TTL_MS } from "@/lib/forge-public-soft-cache";
import { createAnonSupabaseClient } from "@/lib/supabase/anon-client";
import {
  fetchPlayerIaGameHome,
  type PlayerIaGameHomePayload,
} from "@/lib/supabase/player-ia-home-db";

/** Same public TTL + single-flight policy as whole-home (auth-independent shelves). */

type GameHomeCacheEntry = {
  expiresAt: number;
  payload: PlayerIaGameHomePayload;
};

let publicGameHomeCache: GameHomeCacheEntry | null = null;
let publicGameHomeInflight: Promise<PlayerIaGameHomePayload | null> | null =
  null;

/** Game category Home loader (public anon). */
export async function loadPlayerIaGameHome(): Promise<PlayerIaGameHomePayload | null> {
  const now = Date.now();
  if (publicGameHomeCache && publicGameHomeCache.expiresAt > now) {
    return publicGameHomeCache.payload;
  }

  if (publicGameHomeInflight) {
    return publicGameHomeInflight;
  }

  const inflight = (async (): Promise<PlayerIaGameHomePayload | null> => {
    const supabase = createAnonSupabaseClient();
    if (!supabase) {
      return null;
    }
    try {
      const payload = await fetchPlayerIaGameHome(supabase);
      publicGameHomeCache = {
        payload,
        expiresAt: Date.now() + FORGE_PUBLIC_SOFT_CACHE_TTL_MS,
      };
      return payload;
    } catch (error: unknown) {
      console.error("[player-ia-game-home] load failed", error);
      return null;
    }
  })().finally(() => {
    if (publicGameHomeInflight === inflight) {
      publicGameHomeInflight = null;
    }
  });

  publicGameHomeInflight = inflight;
  return inflight;
}
