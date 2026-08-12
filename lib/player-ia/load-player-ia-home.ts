import { createAnonSupabaseClient } from "@/lib/supabase/anon-client";
import {
  fetchPlayerIaHome,
  type PlayerIaHomePayload,
  type PlayerIaHomeTimingMarks,
} from "@/lib/supabase/player-ia-home-db";

/**
 * Shared Home payload loader for page + API route.
 * Public anon data only (no auth/user fields) — safe for request-scoped server use.
 *
 * Short in-memory TTL (20s) for public shelves only: Home is auth-independent,
 * so this never mixes users. Keeps Studio→Player / repeat warm hits from
 * re-running the FB fill probe waterfall on every navigation. Staleness is
 * intentional and short so new FB / updates appear within one refresh window.
 */
const PUBLIC_HOME_CACHE_TTL_MS = 20_000;

type HomeCacheEntry = {
  expiresAt: number;
  payload: PlayerIaHomePayload;
};

let publicHomeCache: HomeCacheEntry | null = null;

export type LoadPlayerIaHomeResult = {
  home: PlayerIaHomePayload | null;
  timing?: PlayerIaHomeTimingMarks;
  cacheHit?: boolean;
};

export async function loadPlayerIaHomeDetailed(): Promise<LoadPlayerIaHomeResult> {
  const now = Date.now();
  if (publicHomeCache && publicHomeCache.expiresAt > now) {
    return {
      home: publicHomeCache.payload,
      cacheHit: true,
    };
  }

  const supabase = createAnonSupabaseClient();
  if (!supabase) {
    return { home: null };
  }
  try {
    let timing: PlayerIaHomeTimingMarks | undefined;
    const home = await fetchPlayerIaHome(supabase, {
      onTiming: (marks) => {
        timing = marks;
      },
    });
    publicHomeCache = {
      payload: home,
      expiresAt: Date.now() + PUBLIC_HOME_CACHE_TTL_MS,
    };
    return { home, timing, cacheHit: false };
  } catch (error: unknown) {
    console.error("[player-ia-home] load failed", error);
    return { home: null };
  }
}

export async function loadPlayerIaHome(): Promise<PlayerIaHomePayload | null> {
  const { home } = await loadPlayerIaHomeDetailed();
  return home;
}
