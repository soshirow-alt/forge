import { createAnonSupabaseClient } from "@/lib/supabase/anon-client";
import {
  fetchPlayerIaCategoryHome,
  type PlayerIaCategoryHomePayload,
} from "@/lib/supabase/player-ia-home-db";
import type { ProjectCategoryId } from "@/lib/project-categories";

export async function loadPlayerIaCategoryHome(
  category: ProjectCategoryId,
): Promise<PlayerIaCategoryHomePayload | null> {
  const supabase = createAnonSupabaseClient();
  if (!supabase) {
    return null;
  }
  try {
    return await fetchPlayerIaCategoryHome(supabase, category);
  } catch (error: unknown) {
    console.error("[player-ia-category-home] load failed", error);
    return null;
  }
}
