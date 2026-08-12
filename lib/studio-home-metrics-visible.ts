import type { StudioHomeConnectionMetrics } from "@/lib/studio-home-metrics";

export type StudioMetricsUiSnapshot = {
  userId: string | null;
  metrics: StudioHomeConnectionMetrics;
  rpcReady: boolean;
  granularityFallback: boolean;
  initialLoading: boolean;
  fetching: boolean;
  error: boolean;
};

/**
 * Render-time selection: never paint metrics owned by a different userId.
 * Pure — unit-tested without mounting React.
 */
export function selectVisibleStudioMetricsSnapshot(
  snapshot: StudioMetricsUiSnapshot,
  currentUserId: string | null,
  emptyMetrics: StudioHomeConnectionMetrics,
  authResolved: boolean,
): StudioMetricsUiSnapshot {
  if (snapshot.userId === currentUserId) {
    return snapshot;
  }
  return {
    userId: currentUserId,
    metrics: emptyMetrics,
    rpcReady: false,
    granularityFallback: false,
    initialLoading: Boolean(authResolved && currentUserId),
    fetching: false,
    error: false,
  };
}
