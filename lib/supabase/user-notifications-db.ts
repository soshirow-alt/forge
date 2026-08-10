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
    | "feedback_reply"
    | "consultation_new"
    | "consultation_message"
    | "usage_relation_request"
    | "usage_relation_accepted"
    | "usage_relation_rejected"
    | "feedback_reciprocity";
  project_id: string | null;
  devlog_id: string | null;
  published_version: string | null;
  version_key: string | null;
  confirmation_request_id: string | null;
  message: string;
  read_at: string | null;
  seen_at: string | null;
  acknowledged_at: string | null;
  requires_acknowledgement: boolean;
  coalesce_key: string | null;
  consultation_id: string | null;
  usage_relation_id: string | null;
  related_user_id: string | null;
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
    projectId: row.project_id ?? "",
    projectTitle,
    read: row.requires_acknowledgement
      ? row.acknowledged_at !== null
      : row.seen_at !== null,
    seenAt: row.seen_at ?? undefined,
    acknowledgedAt: row.acknowledged_at ?? undefined,
    requiresAcknowledgement: row.requires_acknowledgement,
    coalesceKey: row.coalesce_key ?? undefined,
    consultationId: row.consultation_id ?? undefined,
    usageRelationId: row.usage_relation_id ?? undefined,
    relatedUserId: row.related_user_id ?? undefined,
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
  const { error } = await supabase.rpc("acknowledge_notification", {
    p_id: notificationId,
  });

  if (error) {
    throw error;
  }
}

export async function markNotificationsSeen(
  supabase: SupabaseClient,
): Promise<number> {
  const { data, error } = await supabase.rpc("mark_notifications_seen");
  if (error) throw error;
  return Number(data ?? 0);
}

export async function acknowledgeNotificationsByCoalesceKey(
  supabase: SupabaseClient,
  key: string,
): Promise<number> {
  const { data, error } = await supabase.rpc(
    "acknowledge_notifications_by_coalesce_key",
    { p_key: key },
  );
  if (error) throw error;
  return Number(data ?? 0);
}

export async function markVoiceReceivedNotificationsReadForVersion(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  versionKey: string,
): Promise<void> {
  const version = resolvePlayableVersion(versionKey);
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: now, seen_at: now })
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .eq("version_key", version)
    .eq("type", "voice_received")
    .or("read_at.is.null,seen_at.is.null");

  if (error) {
    throw error;
  }
}

export async function markAllUserNotificationsAsRead(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: now, seen_at: now })
    .eq("user_id", userId)
    .or("read_at.is.null,seen_at.is.null");

  if (error) {
    throw error;
  }
}

export function isDatabaseNotificationId(id: string): boolean {
  return !id.startsWith("notification-");
}
