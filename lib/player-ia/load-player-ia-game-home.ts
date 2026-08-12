import { createAnonSupabaseClient } from "@/lib/supabase/anon-client";
import {
  fetchPlayerIaGameHome,
  type PlayerIaGameHomePayload,
} from "@/lib/supabase/player-ia-home-db";

/** Same public TTL policy as whole-home (auth-independent shelves). */
const PUBLIC_GAME_HOME_CACHE_TTL_MS = 20_000;

type GameHomeCacheEntry = {
  expiresAt: number;
  payload: PlayerIaGameHomePayload;
};

let publicGameHomeCache: GameHomeCacheEntry | null = null;

/** Game category Home loader (public anon). */
export async function loadPlayerIaGameHome(): Promise<PlayerIaGameHomePayload | null> {
  const now = Date.now();
  if (publicGameHomeCache && publicGameHomeCache.expiresAt > now) {
    return publicGameHomeCache.payload;
  }

  const supabase = createAnonSupabaseClient();
  if (!supabase) {
    return null;
  }
  try {
    const payload = await fetchPlayerIaGameHome(supabase);
    publicGameHomeCache = {
      payload,
      expiresAt: Date.now() + PUBLIC_GAME_HOME_CACHE_TTL_MS,
    };
    return payload;
  } catch (error: unknown) {
    console.error("[player-ia-game-home] load failed", error);
    return null;
  }
}
