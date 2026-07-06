"use client";

import { useEffect, useRef } from "react";
import { forgePerfLog, forgePerfMark, forgePerfMeasure } from "@/lib/forge-perf-log";
import { forgeSidebarPerfContentReady } from "@/lib/forge-sidebar-perf";

type ForgePerfRouteOptions = {
  route: string;
  ready?: boolean;
  readyLabel?: string;
  context?: Record<string, unknown>;
};

/**
 * Logs route mount time and optional "ready" milestone (e.g. catalog loaded).
 */
export function useForgePerfRoute({
  route,
  ready = false,
  readyLabel = "content-ready",
  context,
}: ForgePerfRouteOptions): void {
  const mountMarkRef = useRef(`route:${route}`);
  const readyLoggedRef = useRef(false);

  useEffect(() => {
    const mark = `${mountMarkRef.current}:${Date.now()}`;
    mountMarkRef.current = mark;
    readyLoggedRef.current = false;
    forgePerfMark(mark);
    forgePerfLog(`route mount`, { route, ...context });

    return () => {
      forgePerfMeasure(`route unmount ${route}`, mark, { route, ...context });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount/unmount per route only
  }, [route]);

  useEffect(() => {
    if (!ready || readyLoggedRef.current) {
      return;
    }

    readyLoggedRef.current = true;
    forgePerfMeasure(`${route} ${readyLabel}`, mountMarkRef.current, {
      route,
      ...context,
    });
    forgeSidebarPerfContentReady(route, context);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- log ready milestone once
  }, [ready, readyLabel, route]);
}
