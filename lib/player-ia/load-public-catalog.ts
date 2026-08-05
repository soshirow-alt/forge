import {
  parseCatalogSearchParams,
  type CatalogSearchParamSource,
} from "@/lib/player-ia/catalog-search-params";
import { createAnonSupabaseClient } from "@/lib/supabase/anon-client";
import {
  fetchPublicProjectsByCategory,
  type CatalogProject,
} from "@/lib/supabase/public-catalog-db";

export type LoadPublicCatalogResult = {
  ok: boolean;
  projects: CatalogProject[];
  /** True when RPC threw. */
  error: boolean;
  /** True when anon client is unavailable. */
  unavailable: boolean;
};

/**
 * Shared catalog loader for Search page + `/api/search/catalog`.
 * Public anon catalog only — no user-specific fields.
 * No cross-request shared cache (prefer correct freshness over shared TTL).
 */
export async function loadPublicCatalog(
  source: CatalogSearchParamSource,
  options?: { limit?: number },
): Promise<LoadPublicCatalogResult> {
  const supabase = createAnonSupabaseClient();
  if (!supabase) {
    return { ok: false, projects: [], error: true, unavailable: true };
  }

  const parsed = parseCatalogSearchParams(source);
  // API historical default is 24; Search page passes 48 explicitly.
  const limit = Math.min(
    Math.max(options?.limit ?? parsed.limit ?? 24, 1),
    60,
  );

  try {
    const projects = await fetchPublicProjectsByCategory(supabase, {
      ...parsed,
      limit,
    });
    return { ok: true, projects, error: false, unavailable: false };
  } catch (error: unknown) {
    console.error("[public-catalog] load failed", error);
    return { ok: false, projects: [], error: true, unavailable: false };
  }
}
