import { createAnonSupabaseClient } from "@/lib/supabase/anon-client";
import {
  fetchPlayerIaHome,
  type PlayerIaHomePayload,
} from "@/lib/supabase/player-ia-home-db";

/**
 * Shared Home payload loader for page + API route.
 * Public anon data only (no auth/user fields) — safe for request-scoped server use.
 * No cross-request shared cache: avoids accidental personalized/stale coupling.
 */
export async function loadPlayerIaHome(): Promise<PlayerIaHomePayload | null> {
  const supabase = createAnonSupabaseClient();
  if (!supabase) {
    return null;
  }
  try {
    return await fetchPlayerIaHome(supabase);
  } catch (error: unknown) {
    console.error("[player-ia-home] load failed", error);
    return null;
  }
}
