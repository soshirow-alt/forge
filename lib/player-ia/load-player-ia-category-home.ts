import { createAnonSupabaseClient } from "@/lib/supabase/anon-client";
import {
  fetchPlayerIaCategoryHome,
  type PlayerIaCategoryHomePayload,
} from "@/lib/supabase/player-ia-home-db";
import type { ProjectCategoryId } from "@/lib/project-categories";

/** Same public TTL policy as whole-home (auth-independent shelves). */
const PUBLIC_CATEGORY_HOME_CACHE_TTL_MS = 20_000;

type CategoryCacheEntry = {
  expiresAt: number;
  payload: PlayerIaCategoryHomePayload;
};

const publicCategoryHomeCache = new Map<ProjectCategoryId, CategoryCacheEntry>();

export async function loadPlayerIaCategoryHome(
  category: ProjectCategoryId,
): Promise<PlayerIaCategoryHomePayload | null> {
  const now = Date.now();
  const cached = publicCategoryHomeCache.get(category);
  if (cached && cached.expiresAt > now) {
    return cached.payload;
  }

  const supabase = createAnonSupabaseClient();
  if (!supabase) {
    return null;
  }
  try {
    const payload = await fetchPlayerIaCategoryHome(supabase, category);
    publicCategoryHomeCache.set(category, {
      payload,
      expiresAt: Date.now() + PUBLIC_CATEGORY_HOME_CACHE_TTL_MS,
    });
    return payload;
  } catch (error: unknown) {
    console.error("[player-ia-category-home] load failed", error);
    return null;
  }
}
