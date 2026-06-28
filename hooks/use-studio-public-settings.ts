"use client";

import { useEffect, useMemo, useState } from "react";
import type { StudioPublicPrefKey } from "@/lib/user-settings-definitions";
import { DEFAULT_USER_SETTINGS } from "@/lib/user-settings-definitions";
import { fetchStudioPublicSettings } from "@/lib/supabase/user-settings-db";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";

export function useStudioPublicSettings(userId: string | null | undefined) {
  const supabase = useMemo(() => getOptionalSupabaseClient(), []);
  const [settings, setSettings] = useState(DEFAULT_USER_SETTINGS.studioPublic);
  const [loaded, setLoaded] = useState(!userId);

  useEffect(() => {
    if (!userId || !supabase) {
      setLoaded(true);
      return;
    }

    let active = true;
    setLoaded(false);

    void fetchStudioPublicSettings(supabase, userId)
      .then((next) => {
        if (active) {
          setSettings(next);
        }
      })
      .catch(() => {
        if (active) {
          setSettings(DEFAULT_USER_SETTINGS.studioPublic);
        }
      })
      .finally(() => {
        if (active) {
          setLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, [supabase, userId]);

  function isEnabled(key: StudioPublicPrefKey): boolean {
    return settings[key] !== false;
  }

  return { settings, loaded, isEnabled };
}
