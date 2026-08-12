"use client";

import { useEffect, useRef, useState } from "react";
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

type SoftCacheEntry = {
  expiresAt: number;
  metrics: StudioHomeConnectionMetrics;
  rpcReady: boolean;
  granularityFallback: boolean;
};

/** Soft client remount cache only — API stays no-store; never shared across users. */
const CLIENT_METRICS_TTL_MS = 20_000;
const softMetricsCache = new Map<StudioHomeGranularity, SoftCacheEntry>();

function readSoftCache(
  granularity: StudioHomeGranularity,
): SoftCacheEntry | null {
  const entry = softMetricsCache.get(granularity);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt <= Date.now()) {
    softMetricsCache.delete(granularity);
    return null;
  }
  return entry;
}

export function useStudioHomeMetrics(granularity: StudioHomeGranularity = "month") {
  const [metrics, setMetrics] = useState<StudioHomeConnectionMetrics>(
    EMPTY_STUDIO_HOME_CONNECTION_METRICS,
  );
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [rpcReady, setRpcReady] = useState(false);
  const [granularityFallback, setGranularityFallback] = useState(false);
  const [error, setError] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let active = true;
    const soft = readSoftCache(granularity);
    if (soft) {
      queueMicrotask(() => {
        if (!active) {
          return;
        }
        setMetrics(soft.metrics);
        setRpcReady(soft.rpcReady);
        setGranularityFallback(soft.granularityFallback);
        setInitialLoading(false);
        setFetching(false);
        setError(false);
        hasLoadedRef.current = true;
      });
      return () => {
        active = false;
      };
    }

    const isRefetch = hasLoadedRef.current;

    queueMicrotask(() => {
      if (!active) {
        return;
      }
      if (isRefetch) {
        setFetching(true);
      } else {
        setInitialLoading(true);
      }
      setError(false);
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
        if (!active) {
          return;
        }
        const nextMetrics = payload.metrics ?? EMPTY_STUDIO_HOME_CONNECTION_METRICS;
        const nextRpcReady = Boolean(payload.rpcReady);
        const nextFallback = Boolean(payload.granularityFallback);
        setMetrics(nextMetrics);
        setRpcReady(nextRpcReady);
        setGranularityFallback(nextFallback);
        softMetricsCache.set(granularity, {
          metrics: nextMetrics,
          rpcReady: nextRpcReady,
          granularityFallback: nextFallback,
          expiresAt: Date.now() + CLIENT_METRICS_TTL_MS,
        });
      })
      .catch(() => {
        if (active) {
          setError(true);
          if (!hasLoadedRef.current) {
            setMetrics(EMPTY_STUDIO_HOME_CONNECTION_METRICS);
          }
        }
      })
      .finally(() => {
        if (active) {
          hasLoadedRef.current = true;
          setInitialLoading(false);
          setFetching(false);
        }
      });

    return () => {
      active = false;
    };
  }, [granularity]);

  return {
    metrics,
    initialLoading,
    fetching,
    rpcReady,
    granularityFallback,
    error,
  };
}
