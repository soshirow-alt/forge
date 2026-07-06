"use client";

import { useEffect, useRef, useState } from "react";
import {
  EMPTY_STUDIO_HOME_CONNECTION_METRICS,
  type StudioHomeConnectionMetrics,
  type StudioHomeGranularity,
} from "@/lib/studio-home-metrics";
import { forgePerfLog } from "@/lib/forge-perf-log";

type MetricsResponse = {
  metrics?: StudioHomeConnectionMetrics;
  rpcReady?: boolean;
  granularity?: StudioHomeGranularity;
  granularityFallback?: boolean;
};

const METRICS_CACHE_TTL_MS = 60_000;
const metricsCache = new Map<
  StudioHomeGranularity,
  { payload: MetricsResponse; fetchedAt: number }
>();

export function useStudioHomeMetrics(granularity: StudioHomeGranularity = "month") {
  const cached = metricsCache.get(granularity);
  const [metrics, setMetrics] = useState<StudioHomeConnectionMetrics>(
    cached?.payload.metrics ?? EMPTY_STUDIO_HOME_CONNECTION_METRICS,
  );
  const [initialLoading, setInitialLoading] = useState(!cached);
  const [fetching, setFetching] = useState(false);
  const [rpcReady, setRpcReady] = useState(Boolean(cached?.payload.rpcReady));
  const [granularityFallback, setGranularityFallback] = useState(
    Boolean(cached?.payload.granularityFallback),
  );
  const [error, setError] = useState(false);
  const hasLoadedRef = useRef(Boolean(cached));

  useEffect(() => {
    let active = true;
    const isRefetch = hasLoadedRef.current;
    const freshCache =
      metricsCache.get(granularity) &&
      Date.now() - (metricsCache.get(granularity)?.fetchedAt ?? 0) < METRICS_CACHE_TTL_MS;

    if (freshCache) {
      const payload = metricsCache.get(granularity)!.payload;
      queueMicrotask(() => {
        if (!active) {
          return;
        }
        setMetrics(payload.metrics ?? EMPTY_STUDIO_HOME_CONNECTION_METRICS);
        setRpcReady(Boolean(payload.rpcReady));
        setGranularityFallback(Boolean(payload.granularityFallback));
        setInitialLoading(false);
        setFetching(false);
        setError(false);
        hasLoadedRef.current = true;
        forgePerfLog("studio.home-metrics cache-hit", { granularity });
      });
      return () => {
        active = false;
      };
    }

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

    void fetch(`/api/studio/home-metrics?granularity=${granularity}`, { cache: "no-store" })
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
        metricsCache.set(granularity, { payload, fetchedAt: Date.now() });
        setMetrics(payload.metrics ?? EMPTY_STUDIO_HOME_CONNECTION_METRICS);
        setRpcReady(Boolean(payload.rpcReady));
        setGranularityFallback(Boolean(payload.granularityFallback));
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
