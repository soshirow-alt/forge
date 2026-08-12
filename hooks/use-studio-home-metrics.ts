"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  clearStudioHomeMetricsSoftCache,
  readStudioHomeMetricsSoftCache,
  writeStudioHomeMetricsSoftCache,
} from "@/lib/studio-home-metrics-soft-cache";
import { selectVisibleStudioMetricsSnapshot } from "@/lib/studio-home-metrics-visible";
import {
  EMPTY_STUDIO_HOME_CONNECTION_METRICS,
  type StudioHomeConnectionMetrics,
  type StudioHomeGranularity,
} from "@/lib/studio-home-metrics";

type MetricsResponse = {
  metrics?: StudioHomeConnectionMetrics;
  rpcReady?: boolean;
  granularity?: StudioHomeGranularity;
  granularityFallback?: boolean;
};

type MetricsSnapshot = {
  userId: string | null;
  metrics: StudioHomeConnectionMetrics;
  rpcReady: boolean;
  granularityFallback: boolean;
  initialLoading: boolean;
  fetching: boolean;
  error: boolean;
};

const EMPTY_SNAPSHOT: MetricsSnapshot = {
  userId: null,
  metrics: EMPTY_STUDIO_HOME_CONNECTION_METRICS,
  rpcReady: false,
  granularityFallback: false,
  initialLoading: true,
  fetching: false,
  error: false,
};

export { clearStudioHomeMetricsSoftCache } from "@/lib/studio-home-metrics-soft-cache";

export function useStudioHomeMetrics(granularity: StudioHomeGranularity = "month") {
  const { user, authResolved } = useAuth();
  const userId = user?.id ?? null;
  const [snapshot, setSnapshot] = useState<MetricsSnapshot>(EMPTY_SNAPSHOT);
  const hasLoadedRef = useRef(false);

  // Render-time guard: never paint another user's metrics on the first frame after switch.
  const visible = selectVisibleStudioMetricsSnapshot(
    snapshot,
    userId,
    EMPTY_STUDIO_HOME_CONNECTION_METRICS,
    authResolved,
  );

  useEffect(() => {
    let active = true;

    if (!authResolved) {
      return () => {
        active = false;
      };
    }

    if (!userId) {
      clearStudioHomeMetricsSoftCache();
      hasLoadedRef.current = false;
      queueMicrotask(() => {
        if (!active) return;
        setSnapshot({
          ...EMPTY_SNAPSHOT,
          userId: null,
          initialLoading: false,
        });
      });
      return () => {
        active = false;
      };
    }

    const soft = readStudioHomeMetricsSoftCache(userId, granularity);
    if (soft) {
      hasLoadedRef.current = true;
      queueMicrotask(() => {
        if (!active) return;
        setSnapshot({
          userId,
          metrics: soft.metrics,
          rpcReady: soft.rpcReady,
          granularityFallback: soft.granularityFallback,
          initialLoading: false,
          fetching: false,
          error: false,
        });
      });
      return () => {
        active = false;
      };
    }

    const isRefetch = hasLoadedRef.current;
    queueMicrotask(() => {
      if (!active) return;
      setSnapshot((prev) => ({
        userId,
        metrics:
          prev.userId === userId
            ? prev.metrics
            : EMPTY_STUDIO_HOME_CONNECTION_METRICS,
        rpcReady: prev.userId === userId ? prev.rpcReady : false,
        granularityFallback:
          prev.userId === userId ? prev.granularityFallback : false,
        initialLoading: isRefetch ? false : true,
        fetching: isRefetch,
        error: false,
      }));
    });

    void fetch(`/api/studio/home-metrics?granularity=${granularity}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("metrics fetch failed");
        }
        return (await response.json()) as MetricsResponse;
      })
      .then((payload) => {
        if (!active) return;
        const nextMetrics = payload.metrics ?? EMPTY_STUDIO_HOME_CONNECTION_METRICS;
        const nextRpcReady = Boolean(payload.rpcReady);
        const nextFallback = Boolean(payload.granularityFallback);
        writeStudioHomeMetricsSoftCache(userId, granularity, {
          metrics: nextMetrics,
          rpcReady: nextRpcReady,
          granularityFallback: nextFallback,
        });
        setSnapshot({
          userId,
          metrics: nextMetrics,
          rpcReady: nextRpcReady,
          granularityFallback: nextFallback,
          initialLoading: false,
          fetching: false,
          error: false,
        });
      })
      .catch(() => {
        if (!active) return;
        setSnapshot((prev) => ({
          userId,
          metrics:
            prev.userId === userId
              ? prev.metrics
              : EMPTY_STUDIO_HOME_CONNECTION_METRICS,
          rpcReady: prev.userId === userId ? prev.rpcReady : false,
          granularityFallback:
            prev.userId === userId ? prev.granularityFallback : false,
          initialLoading: false,
          fetching: false,
          error: true,
        }));
      })
      .finally(() => {
        if (active) {
          hasLoadedRef.current = true;
        }
      });

    return () => {
      active = false;
    };
  }, [authResolved, granularity, userId]);

  return {
    metrics: visible.metrics,
    initialLoading: visible.initialLoading,
    fetching: visible.fetching,
    rpcReady: visible.rpcReady,
    granularityFallback: visible.granularityFallback,
    error: visible.error,
  };
}
