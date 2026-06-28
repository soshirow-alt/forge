"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  countDeveloperFollowersInDb,
  fetchDeveloperFollowersForOwner,
  isDeveloperFollowersListMissingError,
  type DeveloperFollowerForOwner,
} from "@/lib/supabase/developer-follows-db";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";

export function useStudioFollowers() {
  const { user, hydrated } = useAuth();
  const [followers, setFollowers] = useState<DeveloperFollowerForOwner[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [migrationMissing, setMigrationMissing] = useState(false);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!user) {
      setFollowers([]);
      setTotalCount(0);
      setError(null);
      setMigrationMissing(false);
      setLoaded(true);
      return;
    }

    let cancelled = false;
    setLoaded(false);
    setError(null);
    setMigrationMissing(false);

    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      setFollowers([]);
      setTotalCount(0);
      setLoaded(true);
      return;
    }

    void Promise.all([
      fetchDeveloperFollowersForOwner(supabase),
      countDeveloperFollowersInDb(supabase, user.id),
    ])
      .then(([rows, count]) => {
        if (cancelled) {
          return;
        }
        setFollowers(rows);
        setTotalCount(count);
      })
      .catch((caught) => {
        if (cancelled) {
          return;
        }
        setFollowers([]);
        setTotalCount(0);
        if (isDeveloperFollowersListMissingError(caught)) {
          setMigrationMissing(true);
          return;
        }
        setError("フォロワー一覧の読み込みに失敗しました。");
      })
      .finally(() => {
        if (!cancelled) {
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hydrated, user?.id]);

  return { followers, totalCount, loaded, error, migrationMissing };
}
