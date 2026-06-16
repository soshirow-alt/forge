"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  toAdoptionVerifyContext,
  type AdoptionVerifyContextRow,
} from "@/lib/adoption-verify-context";
import { isVoiceAdoptionFixtureMode } from "@/lib/voice-adoption/constants";
import {
  ensureFixtureSeededForUser,
  listFixtureAdoptionsForUser,
} from "@/lib/voice-adoption/fixture-store";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import {
  fetchActiveAdoptionForUserById,
  isVoiceAdoptionsTableMissingError,
} from "@/lib/supabase/voice-adoptions-db";

export function useAdoptionVerifyContext(
  projectId: string,
  adoptionId: string | null,
) {
  const { user, hydrated } = useAuth();
  const [context, setContext] = useState<AdoptionVerifyContextRow | null>(null);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    if (!adoptionId || !user) {
      setContext(null);
      setLoaded(true);
      return;
    }

    if (isVoiceAdoptionFixtureMode()) {
      const rows = ensureFixtureSeededForUser(user.id);
      const match = rows.find((row) => row.id === adoptionId);
      setContext(
        toAdoptionVerifyContext(
          match
            ? {
                id: match.id,
                projectId: match.projectId,
                playerQuote: match.playerQuote,
                updateSummary: match.updateSummary,
                publishedVersion: match.publishedVersion,
              }
            : null,
          projectId,
        ),
      );
      setLoaded(true);
      return;
    }

    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      setContext(null);
      setLoaded(true);
      return;
    }

    try {
      const row = await fetchActiveAdoptionForUserById(
        supabase,
        user.id,
        adoptionId,
      );
      setContext(
        toAdoptionVerifyContext(
          row
            ? {
                id: row.id,
                projectId: row.projectId,
                playerQuote: row.playerQuote,
                updateSummary: row.updateSummary,
                publishedVersion: row.publishedVersion,
              }
            : null,
          projectId,
        ),
      );
    } catch (error) {
      if (isVoiceAdoptionsTableMissingError(error)) {
        setContext(null);
      } else {
        console.error(error);
        setContext(null);
      }
    } finally {
      setLoaded(true);
    }
  }, [adoptionId, projectId, user]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void reload();
  }, [hydrated, reload]);

  return { context, loaded, reload };
}
