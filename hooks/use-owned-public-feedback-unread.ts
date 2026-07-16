"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import {
  listOwnedPublicFeedbackUnreadCounts,
  markProjectPublicFeedbackSeen,
} from "@/lib/supabase/project-feedback-owner-reads-db";

export function useOwnedPublicFeedbackUnread() {
  const { user } = useAuth();
  const [byProjectId, setByProjectId] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    if (!user) {
      setByProjectId({});
      setLoaded(true);
      return;
    }

    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      setByProjectId({});
      setLoaded(true);
      return;
    }

    try {
      const rows = await listOwnedPublicFeedbackUnreadCounts(supabase);
      const next: Record<string, number> = {};
      for (const row of rows) {
        if (row.unreadCount > 0) {
          next[row.projectId] = row.unreadCount;
        }
      }
      setByProjectId(next);
    } catch {
      setByProjectId({});
    } finally {
      setLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    setLoaded(false);
    void reload().finally(() => {
      if (!active) {
        return;
      }
    });
    return () => {
      active = false;
    };
  }, [reload]);

  const totalUnread = useMemo(
    () => Object.values(byProjectId).reduce((sum, count) => sum + count, 0),
    [byProjectId],
  );

  const markSeen = useCallback(
    async (projectId: string) => {
      const supabase = getOptionalSupabaseClient();
      if (!user || !supabase) {
        return;
      }
      await markProjectPublicFeedbackSeen(supabase, projectId);
      setByProjectId((current) => {
        if (!(projectId in current)) {
          return current;
        }
        const next = { ...current };
        delete next[projectId];
        return next;
      });
    },
    [user],
  );

  return {
    byProjectId,
    totalUnread,
    loaded,
    reload,
    markSeen,
    getUnreadCount: (projectId: string) => byProjectId[projectId] ?? 0,
  };
}
