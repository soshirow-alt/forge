"use client";

import { useEffect, useState } from "react";
import {
  EMPTY_STUDIO_HOME_CONNECTION_METRICS,
  type StudioHomeConnectionMetrics,
} from "@/lib/studio-home-metrics";

type MetricsResponse = {
  metrics?: StudioHomeConnectionMetrics;
  rpcReady?: boolean;
};

export function useStudioHomeMetrics() {
  const [metrics, setMetrics] = useState<StudioHomeConnectionMetrics>(
    EMPTY_STUDIO_HOME_CONNECTION_METRICS,
  );
  const [loading, setLoading] = useState(true);
  const [rpcReady, setRpcReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    void fetch("/api/studio/home-metrics", { cache: "no-store" })
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
      })
      .catch(() => {
        if (active) {
          setError(true);
          setMetrics(EMPTY_STUDIO_HOME_CONNECTION_METRICS);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return { metrics, loading, rpcReady, error };
}
