import type { Notification } from "@/lib/notifications";
import {
  getNotificationActionHint,
  getNotificationTypeLabel,
} from "@/lib/notifications";
import { notificationTargetHref } from "@/lib/project-nurture-links";
import type {
  NotificationKind,
  NotificationV0Item,
} from "@/lib/notifications-v0-mock-data";

function notificationKind(type: Notification["type"]): NotificationKind {
  switch (type) {
    case "confirmation_request":
      return "developer_post";
    case "devlog":
    case "version_published":
      return "update";
    case "voice_received":
    case "feedback":
      return "new_feedback";
    case "support":
    case "tester_apply":
      return "system";
    default:
      return "system";
  }
}

function notificationTitle(notification: Notification): string {
  switch (notification.type) {
    case "confirmation_request":
      return "確認依頼が届きました";
    case "version_published":
      return "新しいプレイ可能verが公開されました";
    case "devlog":
      return "開発ログが更新されました";
    case "voice_received":
    case "feedback":
      return "フィードバック関連のお知らせ";
    default:
      return getNotificationTypeLabel(notification.type);
  }
}

function formatRelativeNotificationTime(date: string): string {
  const parsed = Date.parse(date);
  if (Number.isNaN(parsed)) {
    return date;
  }

  const diffMs = Date.now() - parsed;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) {
    return "たった今";
  }
  if (minutes < 60) {
    return `${minutes}分前`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}時間前`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}日前`;
  }

  return new Date(parsed).toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  });
}

export function notificationToV0Item(notification: Notification): NotificationV0Item {
  return {
    id: notification.id,
    kind: notificationKind(notification.type),
    title: notificationTitle(notification),
    body: notification.message,
    timeLabel: formatRelativeNotificationTime(notification.date),
    read: notification.read,
    href: notificationTargetHref(notification),
  };
}

export function buildNotificationActionSuffix(notification: Notification): string {
  return getNotificationActionHint(notification.type);
}
