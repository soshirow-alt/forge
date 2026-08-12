import { FORGE_PUBLIC_SOFT_CACHE_TTL_MS } from "@/lib/forge-public-soft-cache";
import { createAnonSupabaseClient } from "@/lib/supabase/anon-client";
import {
  fetchPlayerIaCategoryHome,
  type PlayerIaCategoryHomePayload,
} from "@/lib/supabase/player-ia-home-db";
import type { ProjectCategoryId } from "@/lib/project-categories";

/** Same public TTL + single-flight policy as whole-home (auth-independent shelves). */

type CategoryCacheEntry = {
  expiresAt: number;
  payload: PlayerIaCategoryHomePayload;
};

const publicCategoryHomeCache = new Map<ProjectCategoryId, CategoryCacheEntry>();
const publicCategoryHomeInflight = new Map<
  ProjectCategoryId,
  Promise<PlayerIaCategoryHomePayload | null>
>();

export async function loadPlayerIaCategoryHome(
  category: ProjectCategoryId,
): Promise<PlayerIaCategoryHomePayload | null> {
  const now = Date.now();
  const cached = publicCategoryHomeCache.get(category);
  if (cached && cached.expiresAt > now) {
    return cached.payload;
  }

  const existing = publicCategoryHomeInflight.get(category);
  if (existing) {
    return existing;
  }

  const inflight = (async (): Promise<PlayerIaCategoryHomePayload | null> => {
    const supabase = createAnonSupabaseClient();
    if (!supabase) {
      return null;
    }
    try {
      const payload = await fetchPlayerIaCategoryHome(supabase, category);
      publicCategoryHomeCache.set(category, {
        payload,
        expiresAt: Date.now() + FORGE_PUBLIC_SOFT_CACHE_TTL_MS,
      });
      return payload;
    } catch (error: unknown) {
      console.error("[player-ia-category-home] load failed", error);
      return null;
    }
  })().finally(() => {
    if (publicCategoryHomeInflight.get(category) === inflight) {
      publicCategoryHomeInflight.delete(category);
    }
  });

  publicCategoryHomeInflight.set(category, inflight);
  return inflight;
}
