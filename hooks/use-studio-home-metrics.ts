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
    const isRefetch = hasLoadedRef.current;

    if (isRefetch) {
      setFetching(true);
    } else {
      setInitialLoading(true);
    }
    setError(false);

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
