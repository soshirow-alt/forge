"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  DEFAULT_USER_SETTINGS,
  forgeEmailNotificationCategoryItems,
  forgeEmailNotificationMasterItem,
  forgeNotificationPlayerItems,
  forgeNotificationStudioItems,
  mergeSettingsToggleItems,
  privacySettingsSection,
  studioPublicSettingsSection,
  type EmailNotificationPrefKey,
  type SettingsToggleItem,
  type UserSettings,
} from "@/lib/user-settings-definitions";
import {
  fetchUserSettings,
  upsertUserSettings,
} from "@/lib/supabase/user-settings-db";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";

type SettingsSnapshot = {
  userId: string;
  settings: UserSettings;
  error: string | null;
  migrationMissing: boolean;
};

export function useUserSettings() {
  const { user, hydrated } = useAuth();
  const supabase = useMemo(() => getOptionalSupabaseClient(), []);
  const [snapshot, setSnapshot] = useState<SettingsSnapshot | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hydrated || !user || !supabase) {
      return;
    }

    let active = true;
    const userId = user.id;

    void fetchUserSettings(supabase, userId)
      .then((next) => {
        if (!active) {
          return;
        }
        setSnapshot({
          userId,
          settings: next,
          error: null,
          migrationMissing: false,
        });
      })
      .catch((caught) => {
        if (!active) {
          return;
        }
        const message =
          caught instanceof Error ? caught.message : "設定の読み込みに失敗しました。";
        setSnapshot({
          userId,
          settings: DEFAULT_USER_SETTINGS,
          error: message.includes("user_settings") ? null : message,
          migrationMissing: message.includes("user_settings"),
        });
      });

    return () => {
      active = false;
    };
  }, [hydrated, user, supabase]);

  const settingsForUser =
    user && snapshot?.userId === user.id ? snapshot.settings : DEFAULT_USER_SETTINGS;
  const loaded = hydrated && (!user || !supabase || snapshot?.userId === user.id);
  const error = user && snapshot?.userId === user.id ? snapshot.error : null;
  const migrationMissing =
    user && snapshot?.userId === user.id ? snapshot.migrationMissing : false;

  const persist = useCallback(
    async (next: UserSettings) => {
      if (!user || !supabase) {
        return;
      }

      setSaving(true);
      try {
        const saved = await upsertUserSettings(supabase, user.id, next);
        setSnapshot({
          userId: user.id,
          settings: saved,
          error: null,
          migrationMissing: false,
        });
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : "設定の保存に失敗しました。";
        setSnapshot((prev) =>
          prev && prev.userId === user.id
            ? { ...prev, error: message }
            : {
                userId: user.id,
                settings: settingsForUser,
                error: message,
                migrationMissing: false,
              },
        );
        throw caught;
      } finally {
        setSaving(false);
      }
    },
    [supabase, user, settingsForUser],
  );

  const updateNotifyPlayer = useCallback(
    async (id: string, enabled: boolean) => {
      const previous = settingsForUser;
      const next: UserSettings = {
        ...settingsForUser,
        notifyPlayer: { ...settingsForUser.notifyPlayer, [id]: enabled },
      };
      try {
        await persist(next);
      } catch (cause) {
        setSnapshot((prev) =>
          user && prev?.userId === user.id
            ? { ...prev, settings: previous }
            : prev,
        );
        throw cause;
      }
    },
    [persist, settingsForUser, user],
  );

  const updateNotifyStudio = useCallback(
    async (id: string, enabled: boolean) => {
      const previous = settingsForUser;
      const next: UserSettings = {
        ...settingsForUser,
        notifyStudio: { ...settingsForUser.notifyStudio, [id]: enabled },
      };
      try {
        await persist(next);
      } catch (cause) {
        setSnapshot((prev) =>
          user && prev?.userId === user.id
            ? { ...prev, settings: previous }
            : prev,
        );
        throw cause;
      }
    },
    [persist, settingsForUser, user],
  );

  const updateNotifyEmail = useCallback(
    async (id: EmailNotificationPrefKey, enabled: boolean) => {
      const previous = settingsForUser;
      const next: UserSettings = {
        ...settingsForUser,
        notifyEmail: { ...settingsForUser.notifyEmail, [id]: enabled },
      };
      try {
        await persist(next);
      } catch (cause) {
        setSnapshot((prev) =>
          user && prev?.userId === user.id
            ? { ...prev, settings: previous }
            : prev,
        );
        throw cause;
      }
    },
    [persist, settingsForUser, user],
  );

  const updatePrivacy = useCallback(
    async (id: string, enabled: boolean) => {
      const previous = settingsForUser;
      const next: UserSettings = {
        ...settingsForUser,
        privacy: { ...settingsForUser.privacy, [id]: enabled },
      };
      try {
        await persist(next);
      } catch (cause) {
        setSnapshot((prev) =>
          user && prev?.userId === user.id
            ? { ...prev, settings: previous }
            : prev,
        );
        throw cause;
      }
    },
    [persist, settingsForUser, user],
  );

  const updateStudioPublic = useCallback(
    async (id: string, enabled: boolean) => {
      const previous = settingsForUser;
      const next: UserSettings = {
        ...settingsForUser,
        studioPublic: { ...settingsForUser.studioPublic, [id]: enabled },
      };
      try {
        await persist(next);
      } catch (cause) {
        setSnapshot((prev) =>
          user && prev?.userId === user.id
            ? { ...prev, settings: previous }
            : prev,
        );
        throw cause;
      }
    },
    [persist, settingsForUser, user],
  );

  const playerNotifications = useMemo(
    () =>
      mergeSettingsToggleItems(
        forgeNotificationPlayerItems,
        settingsForUser.notifyPlayer,
      ),
    [settingsForUser.notifyPlayer],
  );

  const studioNotifications = useMemo(
    () =>
      mergeSettingsToggleItems(
        forgeNotificationStudioItems,
        settingsForUser.notifyStudio,
      ),
    [settingsForUser.notifyStudio],
  );

  const emailMasterItem = useMemo(
    () =>
      mergeSettingsToggleItems(
        [forgeEmailNotificationMasterItem],
        settingsForUser.notifyEmail,
      )[0],
    [settingsForUser.notifyEmail],
  );

  const emailCategoryItems = useMemo(
    () =>
      mergeSettingsToggleItems(
        forgeEmailNotificationCategoryItems,
        settingsForUser.notifyEmail,
      ),
    [settingsForUser.notifyEmail],
  );

  const privacyItems = useMemo(
    () =>
      mergeSettingsToggleItems(
        privacySettingsSection.items,
        settingsForUser.privacy,
      ),
    [settingsForUser.privacy],
  );

  const studioPublicItems = useMemo(
    () =>
      mergeSettingsToggleItems(
        studioPublicSettingsSection.items,
        settingsForUser.studioPublic,
      ),
    [settingsForUser.studioPublic],
  );

  return {
    loaded,
    saving,
    error,
    migrationMissing,
    playerNotifications,
    studioNotifications,
    emailMasterItem,
    emailCategoryItems,
    privacyItems,
    studioPublicItems,
    updateNotifyPlayer,
    updateNotifyStudio,
    updateNotifyEmail,
    updatePrivacy,
    updateStudioPublic,
  };
}

export type { SettingsToggleItem };
