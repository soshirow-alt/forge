import type { SupabaseClient } from "@supabase/supabase-js";
import type { Notification } from "@/lib/notifications";

type NotificationRow = {
  id: string;
  user_id: string;
  type: "devlog" | "version_published";
  project_id: string;
  devlog_id: string | null;
  published_version: string | null;
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
