"use client";

import { useEffect, useState } from "react";
import { fetchPublicXProfile } from "@/lib/supabase/user-x-profiles-db";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import type { PublicXProfile } from "@/lib/x-auth";

export function usePublicXProfile(userId: string | null | undefined) {
  const supabase = getOptionalSupabaseClient();
  const [profile, setProfile] = useState<PublicXProfile | null>(null);
  const [loaded, setLoaded] = useState(!userId || !supabase);

  useEffect(() => {
    if (!userId || !supabase) {
      return;
    }

    let cancelled = false;

    void fetchPublicXProfile(supabase, userId).then((result) => {
      if (cancelled) {
        return;
      }
      setProfile(result);
      setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [userId, supabase]);

  return { profile, loaded };
}
