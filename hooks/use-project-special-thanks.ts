"use client";

import { useEffect, useState } from "react";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import {
  EMPTY_PROJECT_SPECIAL_THANKS,
  fetchProjectSpecialThanks,
  type ProjectSpecialThanks,
} from "@/lib/supabase/project-special-thanks-db";

type FetchedState = {
  projectId: string;
  data: ProjectSpecialThanks;
  error: string | null;
};

export function useProjectSpecialThanks(projectId: string | null | undefined) {
  const [fetched, setFetched] = useState<FetchedState | null>(null);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    let cancelled = false;
    const supabase = getOptionalSupabaseClient();

    const apply = (data: ProjectSpecialThanks, error: string | null) => {
      if (!cancelled) {
        setFetched({ projectId, data, error });
      }
    };

    if (!supabase) {
      queueMicrotask(() => apply(EMPTY_PROJECT_SPECIAL_THANKS, null));
      return () => {
        cancelled = true;
      };
    }

    void fetchProjectSpecialThanks(supabase, projectId)
      .then((next) => apply(next, null))
      .catch(() =>
        apply(EMPTY_PROJECT_SPECIAL_THANKS, "Special Thanks を読み込めませんでした。"),
      );

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (!projectId) {
    return {
      data: EMPTY_PROJECT_SPECIAL_THANKS,
      loaded: true,
      error: null,
    };
  }

  const loaded = fetched?.projectId === projectId;
  return {
    data: loaded ? fetched.data : EMPTY_PROJECT_SPECIAL_THANKS,
    loaded,
    error: loaded ? fetched.error : null,
  };
}
