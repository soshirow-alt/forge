import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_USER_SETTINGS,
  type EmailNotificationPrefKey,
  type PlayerNotificationPrefKey,
  type PrivacyPrefKey,
  type StudioNotificationPrefKey,
  type StudioPublicPrefKey,
  type UserSettings,
} from "@/lib/user-settings-definitions";

type UserSettingsRow = {
  user_id: string;
  notify_player: Record<string, boolean>;
  notify_studio: Record<string, boolean>;
  notify_email?: Record<string, boolean> | null;
  privacy: Record<string, boolean>;
  studio_public: Record<string, boolean>;
};

function mergeJsonbRecord<T extends Record<string, boolean>>(
  defaults: T,
  stored: Record<string, boolean> | null | undefined,
): T {
  return { ...defaults, ...(stored ?? {}) };
}

export function rowToUserSettings(row: UserSettingsRow | null): UserSettings {
  if (!row) {
    return DEFAULT_USER_SETTINGS;
  }

  return {
    notifyPlayer: mergeJsonbRecord(
      DEFAULT_USER_SETTINGS.notifyPlayer,
      row.notify_player,
    ),
    notifyStudio: mergeJsonbRecord(
      DEFAULT_USER_SETTINGS.notifyStudio,
      row.notify_studio,
    ),
    notifyEmail: mergeJsonbRecord(
      DEFAULT_USER_SETTINGS.notifyEmail,
      row.notify_email ?? undefined,
    ),
    privacy: mergeJsonbRecord(DEFAULT_USER_SETTINGS.privacy, row.privacy),
    studioPublic: mergeJsonbRecord(
      DEFAULT_USER_SETTINGS.studioPublic,
      row.studio_public,
    ),
  };
}

export function userSettingsToRow(userId: string, settings: UserSettings) {
  return {
    user_id: userId,
    notify_player: settings.notifyPlayer,
    notify_studio: settings.notifyStudio,
    notify_email: settings.notifyEmail,
    privacy: settings.privacy,
    studio_public: settings.studioPublic,
  };
}

const SELECT_COLUMNS =
  "user_id, notify_player, notify_studio, notify_email, privacy, studio_public";

export async function fetchUserSettings(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserSettings> {
  const { data, error } = await supabase
    .from("user_settings")
    .select(SELECT_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    // Pre-096: notify_email column missing — retry without it.
    if (/notify_email/i.test(error.message)) {
      const legacy = await supabase
        .from("user_settings")
        .select("user_id, notify_player, notify_studio, privacy, studio_public")
        .eq("user_id", userId)
        .maybeSingle();
      if (legacy.error) {
        if (
          legacy.error.message.includes("user_settings") ||
          legacy.error.message.includes("does not exist")
        ) {
          return DEFAULT_USER_SETTINGS;
        }
        throw legacy.error;
      }
      return rowToUserSettings((legacy.data as UserSettingsRow | null) ?? null);
    }
    if (
      error.message.includes("user_settings") ||
      error.message.includes("does not exist")
    ) {
      return DEFAULT_USER_SETTINGS;
    }
    throw error;
  }

  return rowToUserSettings((data as UserSettingsRow | null) ?? null);
}

export async function upsertUserSettings(
  supabase: SupabaseClient,
  userId: string,
  settings: UserSettings,
): Promise<UserSettings> {
  const payload = userSettingsToRow(userId, settings);
  const { data, error } = await supabase
    .from("user_settings")
    .upsert(payload, { onConflict: "user_id" })
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return rowToUserSettings(data as UserSettingsRow);
}

export async function filterUsersByPlayerNotificationPref(
  supabase: SupabaseClient,
  userIds: string[],
  prefKey: PlayerNotificationPrefKey,
): Promise<string[]> {
  if (userIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase.rpc("filter_users_by_player_notification_pref", {
    p_user_ids: userIds,
    p_pref_key: prefKey,
  });

  if (error) {
    if (error.message.includes("filter_users_by_player_notification_pref")) {
      return userIds;
    }
    throw error;
  }

  return (data as string[] | null) ?? userIds;
}

export async function filterUsersByStudioNotificationPref(
  supabase: SupabaseClient,
  userIds: string[],
  prefKey: StudioNotificationPrefKey,
): Promise<string[]> {
  if (userIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase.rpc("filter_users_by_studio_notification_pref", {
    p_user_ids: userIds,
    p_pref_key: prefKey,
  });

  if (error) {
    if (error.message.includes("filter_users_by_studio_notification_pref")) {
      return userIds;
    }
    throw error;
  }

  return (data as string[] | null) ?? userIds;
}

export async function fetchStudioPublicSettings(
  supabase: SupabaseClient,
  userId: string,
): Promise<Record<StudioPublicPrefKey, boolean>> {
  const { data, error } = await supabase.rpc("get_user_studio_public_settings", {
    p_user_id: userId,
  });

  if (error) {
    if (error.message.includes("get_user_studio_public_settings")) {
      return DEFAULT_USER_SETTINGS.studioPublic;
    }
    throw error;
  }

  return mergeJsonbRecord(
    DEFAULT_USER_SETTINGS.studioPublic,
    (data as Record<string, boolean> | null) ?? undefined,
  );
}

export function isPrivacyEnabled(
  settings: UserSettings,
  key: PrivacyPrefKey,
): boolean {
  return settings.privacy[key] !== false;
}

export function isStudioPublicEnabled(
  settings: Record<StudioPublicPrefKey, boolean>,
  key: StudioPublicPrefKey,
): boolean {
  return settings[key] !== false;
}

export type {
  StudioNotificationPrefKey,
  PlayerNotificationPrefKey,
  EmailNotificationPrefKey,
};
