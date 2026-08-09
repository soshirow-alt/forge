import { createAnonSupabaseClient } from "@/lib/supabase/anon-client";
import {
  fetchPlayerIaGameHome,
  type PlayerIaGameHomePayload,
} from "@/lib/supabase/player-ia-home-db";

/** Game category Home loader (public anon). */
export async function loadPlayerIaGameHome(): Promise<PlayerIaGameHomePayload | null> {
  const supabase = createAnonSupabaseClient();
  if (!supabase) {
    return null;
  }
  try {
    return await fetchPlayerIaGameHome(supabase);
  } catch (error: unknown) {
    console.error("[player-ia-game-home] load failed", error);
    return null;
  }
}
