"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { replaceUrlWithoutNavigation } from "@/lib/instant-url-sync";
import {
  forgePerfLog,
  forgePerfMark,
  forgePerfMeasure,
} from "@/lib/forge-perf-log";

type UseInstantQueryTabOptions<T extends string> = {
  paramName?: string;
  parse: (value: string | null) => T;
  buildHref: (tab: T, searchParams: URLSearchParams) => string;
  perfScope?: string;
};

/**
 * Instant tab switching: local state updates immediately; URL syncs via replaceState
 * (no Next.js navigation / useSearchParams re-render cascade).
 */
export function useInstantQueryTab<T extends string>({
  paramName = "tab",
  parse,
  buildHref,
  perfScope = "tab",
}: UseInstantQueryTabOptions<T>) {
  const searchParams = useSearchParams();
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const readTabFromUrl = useCallback((): T => {
    return parse(searchParamsRef.current.get(paramName));
  }, [paramName, parse]);

  const urlTab = parse(searchParams.get(paramName));
  const [activeTab, setActiveTabState] = useState<T>(urlTab);

  useEffect(() => {
    setActiveTabState(urlTab);
  }, [urlTab]);

  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveTabState(parse(params.get(paramName)));
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [paramName, parse]);

  const setActiveTab = useCallback(
    (tab: T) => {
      const mark = `${perfScope}:click:${tab}:${Date.now()}`;
      forgePerfMark(mark);
      forgePerfLog(`${perfScope}.switch`, { tab, method: "instant" });

      setActiveTabState(tab);

      const href = buildHref(tab, new URLSearchParams(searchParamsRef.current.toString()));
      replaceUrlWithoutNavigation(href);

      requestAnimationFrame(() => {
        forgePerfMeasure(`${perfScope}.underline`, mark, { tab, phase: "rAF1" });
        requestAnimationFrame(() => {
          forgePerfMeasure(`${perfScope}.panel`, mark, { tab, phase: "rAF2" });
        });
      });
    },
    [buildHref, perfScope],
  );

  return {
    activeTab,
    setActiveTab,
    readTabFromUrl,
  };
}
