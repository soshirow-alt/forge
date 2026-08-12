import type {
  StudioHomeConnectionMetrics,
  StudioHomeGranularity,
} from "@/lib/studio-home-metrics";

export type StudioHomeMetricsSoftCacheEntry = {
  expiresAt: number;
  userId: string;
  metrics: StudioHomeConnectionMetrics;
  rpcReady: boolean;
  granularityFallback: boolean;
};

/** Soft client remount cache only — API stays no-store; keyed by userId. */
export const STUDIO_HOME_METRICS_SOFT_CACHE_TTL_MS = 20_000;

const softMetricsCache = new Map<string, StudioHomeMetricsSoftCacheEntry>();

export function studioHomeMetricsCacheKey(
  userId: string,
  granularity: StudioHomeGranularity,
): string {
  return `${userId}:${granularity}`;
}

export function readStudioHomeMetricsSoftCache(
  userId: string,
  granularity: StudioHomeGranularity,
): StudioHomeMetricsSoftCacheEntry | null {
  const key = studioHomeMetricsCacheKey(userId, granularity);
  const entry = softMetricsCache.get(key);
  if (!entry) {
    return null;
  }
  if (entry.userId !== userId || entry.expiresAt <= Date.now()) {
    softMetricsCache.delete(key);
    return null;
  }
  return entry;
}

export function writeStudioHomeMetricsSoftCache(
  userId: string,
  granularity: StudioHomeGranularity,
  entry: Omit<StudioHomeMetricsSoftCacheEntry, "userId" | "expiresAt"> & {
    expiresAt?: number;
  },
): void {
  softMetricsCache.set(studioHomeMetricsCacheKey(userId, granularity), {
    userId,
    metrics: entry.metrics,
    rpcReady: entry.rpcReady,
    granularityFallback: entry.granularityFallback,
    expiresAt: entry.expiresAt ?? Date.now() + STUDIO_HOME_METRICS_SOFT_CACHE_TTL_MS,
  });
}

/** Clear all Studio metrics soft-cache entries (call on logout / SIGNED_OUT). */
export function clearStudioHomeMetricsSoftCache(): void {
  softMetricsCache.clear();
}

/** Pure ownership gate for React snapshots (hook + deterministic tests). */
export function selectOwnedStudioMetricsSnapshot<
  T extends { userId: string },
>(snapshot: T | null, userId: string | null): T | null {
  if (!snapshot || !userId || snapshot.userId !== userId) {
    return null;
  }
  return snapshot;
}
