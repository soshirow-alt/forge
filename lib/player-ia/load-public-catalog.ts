import {
  parseCatalogSearchParams,
  type CatalogSearchParamSource,
} from "@/lib/player-ia/catalog-search-params";
import { FORGE_PUBLIC_SOFT_CACHE_TTL_MS } from "@/lib/forge-public-soft-cache";
import { createAnonSupabaseClient } from "@/lib/supabase/anon-client";
import {
  fetchPublicProjectsByCategory,
  type CatalogProject,
  type CatalogSearchParams,
} from "@/lib/supabase/public-catalog-db";

export type LoadPublicCatalogResult = {
  ok: boolean;
  projects: CatalogProject[];
  error: boolean;
  unavailable: boolean;
  cacheHit?: boolean;
};

type CatalogCacheEntry = {
  expiresAt: number;
  result: LoadPublicCatalogResult;
};

const PUBLIC_CATALOG_CACHE_MAX = 64;
const publicCatalogCache = new Map<string, CatalogCacheEntry>();
const publicCatalogInflight = new Map<string, Promise<LoadPublicCatalogResult>>();

/** Stable key: distinguishes null vs false and includes offset/limit/all filters. */
export function buildPublicCatalogCacheKey(
  parsed: CatalogSearchParams,
  limit: number,
  offset: number,
): string {
  return JSON.stringify({
    ...parsed,
    limit,
    offset,
  });
}

function prunePublicCatalogCache(now: number): void {
  for (const [key, entry] of publicCatalogCache) {
    if (entry.expiresAt <= now) {
      publicCatalogCache.delete(key);
    }
  }
  while (publicCatalogCache.size > PUBLIC_CATALOG_CACHE_MAX) {
    const oldest = publicCatalogCache.keys().next().value;
    if (oldest == null) break;
    publicCatalogCache.delete(oldest);
  }
}

/**
 * Shared catalog loader for Search page + `/api/search/catalog`.
 * Public anon catalog only — no user-specific fields.
 * 20s in-process TTL + single-flight; key distinguishes null vs false.
 */
export async function loadPublicCatalog(
  source: CatalogSearchParamSource,
  options?: { limit?: number },
): Promise<LoadPublicCatalogResult> {
  const parsed = parseCatalogSearchParams(source);
  const limit = Math.min(
    Math.max(options?.limit ?? parsed.limit ?? 24, 1),
    60,
  );
  const offset = Math.max(parsed.offset ?? 0, 0);
  const cacheKey = buildPublicCatalogCacheKey(parsed, limit, offset);

  const now = Date.now();
  prunePublicCatalogCache(now);

  const cached = publicCatalogCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return { ...cached.result, cacheHit: true };
  }

  const existing = publicCatalogInflight.get(cacheKey);
  if (existing) {
    return existing;
  }

  const inflight = (async (): Promise<LoadPublicCatalogResult> => {
    const supabase = createAnonSupabaseClient();
    if (!supabase) {
      return { ok: false, projects: [], error: true, unavailable: true };
    }

    try {
      const projects = await fetchPublicProjectsByCategory(supabase, {
        ...parsed,
        limit,
        offset,
      });
      const result: LoadPublicCatalogResult = {
        ok: true,
        projects,
        error: false,
        unavailable: false,
        cacheHit: false,
      };
      prunePublicCatalogCache(Date.now());
      publicCatalogCache.set(cacheKey, {
        result: { ...result, cacheHit: false },
        expiresAt: Date.now() + FORGE_PUBLIC_SOFT_CACHE_TTL_MS,
      });
      return result;
    } catch (error: unknown) {
      console.error("[public-catalog] load failed", error);
      return { ok: false, projects: [], error: true, unavailable: false };
    }
  })().finally(() => {
    if (publicCatalogInflight.get(cacheKey) === inflight) {
      publicCatalogInflight.delete(cacheKey);
    }
  });

  publicCatalogInflight.set(cacheKey, inflight);
  return inflight;
}
