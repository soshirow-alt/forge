"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { fetchOwnXProfile } from "@/lib/supabase/user-x-profiles-db";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import { formatXHandleLabel, hasLinkedXIdentity } from "@/lib/x-auth";

export function useOwnXLinkStatus() {
  const { user, hydrated } = useAuth();
  const supabase = getOptionalSupabaseClient();
  const [linkedHandle, setLinkedHandle] = useState<string | null>(null);
  const [authLinked, setAuthLinked] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!hydrated || !user || !supabase) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const [{ data: authUser }, storedProfile] = await Promise.all([
        supabase.auth.getUser(),
        fetchOwnXProfile(supabase),
      ]);

      if (cancelled) {
        return;
      }

      setAuthLinked(authUser.user ? hasLinkedXIdentity(authUser.user) : false);
      setLinkedHandle(storedProfile?.x_username ?? null);
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, user, supabase]);

  const handleLabel = formatXHandleLabel(linkedHandle);
  const isLinked = Boolean(handleLabel) || authLinked;

  return {
    hydrated,
    user,
    supabaseConfigured: Boolean(supabase),
    loaded: !supabase || loaded,
    handleLabel,
    isLinked,
  };
}
