import type { SupabaseClient } from "@supabase/supabase-js";
import type { Notification } from "@/lib/notifications";
import { resolvePlayableVersion } from "@/lib/playable-version";

type NotificationRow = {
  id: string;
  user_id: string;
  type:
    | "devlog"
    | "version_published"
    | "voice_received"
    | "confirmation_request"
    | "project_watched"
    | "followed_developer_new_project"
    | "followed_developer_released_project"
    | "feedback_reply";
  project_id: string;
  devlog_id: string | null;
  published_version: string | null;
  version_key: string | null;
  confirmation_request_id: string | null;
  message: string;
  read_at: string | null;
  created_at: string;
};

export function notificationRowToNotification(
  row: NotificationRow,
  projectTitle: string,
): Notification {
  return {
    id: row.id,
    type: row.type,
    message: row.message,
    date: row.created_at,
    projectId: row.project_id,
    projectTitle,
    read: row.read_at !== null,
    publishedVersion: row.published_version ?? undefined,
  };
}

export async function fetchUserNotifications(
  supabase: SupabaseClient,
  userId: string,
): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("user_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as NotificationRow[];
}

export async function insertVersionPublishedNotifications(
  supabase: SupabaseClient,
  input: {
    recipientUserIds: string[];
    projectId: string;
    devlogId: string;
    publishedVersion: string;
    message: string;
  },
): Promise<void> {
  if (input.recipientUserIds.length === 0) {
    return;
  }

  const rows = input.recipientUserIds.map((userId) => ({
    user_id: userId,
    type: "version_published" as const,
    project_id: input.projectId,
    devlog_id: input.devlogId,
    published_version: input.publishedVersion,
    message: input.message,
  }));

  const { error } = await supabase.from("user_notifications").insert(rows);

  if (error) {
    throw error;
  }
}

export async function insertDevlogNotifications(
  supabase: SupabaseClient,
  input: {
    recipientUserIds: string[];
    projectId: string;
    devlogId: string;
    message: string;
  },
): Promise<void> {
  if (input.recipientUserIds.length === 0) {
    return;
  }

  const rows = input.recipientUserIds.map((userId) => ({
    user_id: userId,
    type: "devlog" as const,
    project_id: input.projectId,
    devlog_id: input.devlogId,
    message: input.message,
  }));

  const { error } = await supabase.from("user_notifications").insert(rows);

  if (error) {
    throw error;
  }
}

export async function insertConfirmationRequestNotifications(
  supabase: SupabaseClient,
  input: {
    recipientUserIds: string[];
    projectId: string;
    devlogId: string;
    confirmationRequestId: string;
    publishedVersion?: string | null;
    message: string;
  },
): Promise<void> {
  if (input.recipientUserIds.length === 0) {
    return;
  }

  const rows = input.recipientUserIds.map((userId) => ({
    user_id: userId,
    type: "confirmation_request" as const,
    project_id: input.projectId,
    devlog_id: input.devlogId,
    confirmation_request_id: input.confirmationRequestId,
    published_version: input.publishedVersion ?? null,
    message: input.message,
  }));

  const { error } = await supabase.from("user_notifications").insert(rows);

  if (error) {
    throw error;
  }
}

export function isNotificationTypeMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : String(error);

  return (
    message.includes("user_notifications_type_check") ||
    message.includes("violates check constraint") ||
    (message.includes("type") && message.includes("not allowed"))
  );
}

export async function insertFollowedDeveloperNewProjectNotifications(
  supabase: SupabaseClient,
  input: {
    recipientUserIds: string[];
    projectId: string;
    message: string;
  },
): Promise<void> {
  if (input.recipientUserIds.length === 0) {
    return;
  }

  const rows = input.recipientUserIds.map((userId) => ({
    user_id: userId,
    type: "followed_developer_new_project" as const,
    project_id: input.projectId,
    message: input.message,
  }));

  const { error } = await supabase.from("user_notifications").insert(rows);

  if (error) {
    throw error;
  }
}

export async function insertFollowedDeveloperReleasedProjectNotifications(
  supabase: SupabaseClient,
  input: {
    recipientUserIds: string[];
    projectId: string;
    message: string;
  },
): Promise<void> {
  if (input.recipientUserIds.length === 0) {
    return;
  }

  const rows = input.recipientUserIds.map((userId) => ({
    user_id: userId,
    type: "followed_developer_released_project" as const,
    project_id: input.projectId,
    message: input.message,
  }));

  const { error } = await supabase.from("user_notifications").insert(rows);

  if (error) {
    throw error;
  }
}

export async function markUserNotificationAsRead(
  supabase: SupabaseClient,
  userId: string,
  notificationId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function markVoiceReceivedNotificationsReadForVersion(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  versionKey: string,
): Promise<void> {
  const version = resolvePlayableVersion(versionKey);
  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .eq("version_key", version)
    .eq("type", "voice_received")
    .is("read_at", null);

  if (error) {
    throw error;
  }
}

export async function markAllUserNotificationsAsRead(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    throw error;
  }
}

export function isDatabaseNotificationId(id: string): boolean {
  return !id.startsWith("notification-");
}
