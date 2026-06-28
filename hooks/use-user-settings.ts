"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  DEFAULT_USER_SETTINGS,
  forgeNotificationPlayerItems,
  forgeNotificationStudioItems,
  mergeSettingsToggleItems,
  privacySettingsSection,
  studioPublicSettingsSection,
  type SettingsToggleItem,
  type UserSettings,
} from "@/lib/user-settings-definitions";
import {
  fetchUserSettings,
  upsertUserSettings,
} from "@/lib/supabase/user-settings-db";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";

export function useUserSettings() {
  const { user, hydrated } = useAuth();
  const supabase = useMemo(() => getOptionalSupabaseClient(), []);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [migrationMissing, setMigrationMissing] = useState(false);

  useEffect(() => {
    if (!hydrated || !user || !supabase) {
      setLoaded(hydrated);
      return;
    }

    let active = true;
    setLoaded(false);
    setError(null);
    setMigrationMissing(false);

    void fetchUserSettings(supabase, user.id)
      .then((next) => {
        if (!active) {
          return;
        }
        setSettings(next);
      })
      .catch((caught) => {
        if (!active) {
          return;
        }
        const message = caught instanceof Error ? caught.message : "設定の読み込みに失敗しました。";
        if (message.includes("user_settings")) {
          setMigrationMissing(true);
        } else {
          setError(message);
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
  }, [hydrated, user, supabase]);

  const persist = useCallback(
    async (next: UserSettings) => {
      if (!user || !supabase) {
        return;
      }

      setSaving(true);
      setError(null);

      try {
        const saved = await upsertUserSettings(supabase, user.id, next);
        setSettings(saved);
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : "設定の保存に失敗しました。";
        setError(message);
        throw caught;
      } finally {
        setSaving(false);
      }
    },
    [supabase, user],
  );

  const updateNotifyPlayer = useCallback(
    async (id: string, enabled: boolean) => {
      const next: UserSettings = {
        ...settings,
        notifyPlayer: { ...settings.notifyPlayer, [id]: enabled },
      };
      setSettings(next);
      await persist(next);
    },
    [persist, settings],
  );

  const updateNotifyStudio = useCallback(
    async (id: string, enabled: boolean) => {
      const next: UserSettings = {
        ...settings,
        notifyStudio: { ...settings.notifyStudio, [id]: enabled },
      };
      setSettings(next);
      await persist(next);
    },
    [persist, settings],
  );

  const updatePrivacy = useCallback(
    async (id: string, enabled: boolean) => {
      const next: UserSettings = {
        ...settings,
        privacy: { ...settings.privacy, [id]: enabled },
      };
      setSettings(next);
      await persist(next);
    },
    [persist, settings],
  );

  const updateStudioPublic = useCallback(
    async (id: string, enabled: boolean) => {
      const next: UserSettings = {
        ...settings,
        studioPublic: { ...settings.studioPublic, [id]: enabled },
      };
      setSettings(next);
      await persist(next);
    },
    [persist, settings],
  );

  const playerNotifications = useMemo(
    () => mergeSettingsToggleItems(forgeNotificationPlayerItems, settings.notifyPlayer),
    [settings.notifyPlayer],
  );

  const studioNotifications = useMemo(
    () => mergeSettingsToggleItems(forgeNotificationStudioItems, settings.notifyStudio),
    [settings.notifyStudio],
  );

  const privacyItems = useMemo(
    () => mergeSettingsToggleItems(privacySettingsSection.items, settings.privacy),
    [settings.privacy],
  );

  const studioPublicItems = useMemo(
    () => mergeSettingsToggleItems(studioPublicSettingsSection.items, settings.studioPublic),
    [settings.studioPublic],
  );

  return {
    loaded,
    saving,
    error,
    migrationMissing,
    playerNotifications,
    studioNotifications,
    privacyItems,
    studioPublicItems,
    updateNotifyPlayer,
    updateNotifyStudio,
    updatePrivacy,
    updateStudioPublic,
  };
}

export type { SettingsToggleItem };
