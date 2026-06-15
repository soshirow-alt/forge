"use client";

/**
 * 現行版 voice の読了状態 hook（Supabase project_voice_reads）。
 *
 * キー: projectId + playableVersion + source_type=voice
 */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import {
  fetchVoiceReadForVersion,
  upsertVoiceReadForVersion,
} from "@/lib/supabase/voice-reads-db";
import { markVoiceReceivedNotificationsReadForVersion } from "@/lib/supabase/user-notifications-db";

export function useNurtureVoiceRead(
  projectId: string,
  versionKey: string | undefined,
) {
  const { user } = useAuth();
  const { reloadNotifications } = useGames();
  const [isRead, setIsRead] = useState(false);
  const [ready, setReady] = useState(false);
  const supabase = getOptionalSupabaseClient();
  const canFetch = Boolean(versionKey && user && supabase);

  useEffect(() => {
    if (!canFetch || !versionKey || !user || !supabase) {
      return;
    }

    let active = true;
    setReady(false);

    void fetchVoiceReadForVersion(supabase, user.id, projectId, versionKey)
      .then((read) => {
        if (active) {
          setIsRead(read);
        }
      })
      .catch(() => {
        if (active) {
          setIsRead(false);
        }
      })
      .finally(() => {
        if (active) {
          setReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, [canFetch, projectId, supabase, user, versionKey]);

  const markRead = useCallback(async () => {
    if (!versionKey || !user || !supabase) {
      return;
    }

    await upsertVoiceReadForVersion(supabase, user.id, projectId, versionKey);
    await markVoiceReceivedNotificationsReadForVersion(
      supabase,
      user.id,
      projectId,
      versionKey,
    );
    setIsRead(true);
    void reloadNotifications();
  }, [projectId, reloadNotifications, supabase, user, versionKey]);

  if (!canFetch) {
    return { isRead: false, markRead, ready: true };
  }

  return { isRead, markRead, ready };
}

/** @deprecated useNurtureVoiceRead を使用 */
export function useNurtureFeedbackRead(
  projectId: string,
  versionKey: string | undefined,
) {
  return useNurtureVoiceRead(projectId, versionKey);
}
