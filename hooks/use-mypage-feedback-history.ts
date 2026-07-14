"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import { fetchAllUserFeedback } from "@/lib/supabase/user-feedback-history-db";
import { fetchAllUserVoiceResponses } from "@/lib/supabase/user-voice-history-db";
import { fetchActiveAdoptionsForUser } from "@/lib/supabase/voice-adoptions-db";
import { isVoiceAdoptionPlayerVisible } from "@/lib/voice-adoption/constants";
import {
  buildFeedbackHistoryEntries,
  type FeedbackHistoryEntry,
} from "@/lib/mypage-feedback-history";

export function useMyPageFeedbackHistory(): {
  entries: FeedbackHistoryEntry[];
  loading: boolean;
} {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<FeedbackHistoryEntry[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const supabase = getOptionalSupabaseClient();
      if (!supabase || !user?.id) {
        if (!cancelled) {
          setEntries([]);
          setLoading(false);
        }
        return;
      }

      try {
        const [deep, voices, adoptions] = await Promise.all([
          fetchAllUserFeedback(supabase, user.id),
          fetchAllUserVoiceResponses(supabase, user.id),
          isVoiceAdoptionPlayerVisible()
            ? fetchActiveAdoptionsForUser(supabase, user.id)
            : Promise.resolve([]),
        ]);

        if (cancelled) {
          return;
        }

        const reflected = new Set(adoptions.map((row) => row.projectId));
        setEntries(
          buildFeedbackHistoryEntries({
            deepFeedback: deep,
            voiceRows: voices,
            reflectedProjectIds: reflected,
          }),
        );
      } catch {
        if (!cancelled) {
          setEntries([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { entries, loading };
}

export function useFeedbackHistoryGames(entries: FeedbackHistoryEntry[]) {
  const { getPublicGameById, getSubmittedGameById, getGameById } = useGames();

  return useMemo(() => {
    const map = new Map<
      string,
      { title: string; available: boolean }
    >();
    for (const entry of entries) {
      if (map.has(entry.projectId)) {
        continue;
      }
      const game =
        getPublicGameById(entry.projectId) ??
        getSubmittedGameById(entry.projectId) ??
        getGameById(entry.projectId);
      if (game && game.visibility !== "private") {
        map.set(entry.projectId, { title: game.title, available: true });
      } else if (game) {
        map.set(entry.projectId, {
          title: game.title,
          available: false,
        });
      } else {
        map.set(entry.projectId, {
          title: "非公開または削除された作品",
          available: false,
        });
      }
    }
    return map;
  }, [entries, getPublicGameById, getSubmittedGameById, getGameById]);
}
