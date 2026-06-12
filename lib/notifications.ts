export type NotificationType = "support" | "tester_apply" | "feedback" | "devlog";

export type Notification = {
  id: string;
  type: NotificationType;
  message: string;
  date: string;
  projectId: string;
  projectTitle: string;
  read: boolean;
};

export function getNotificationTypeLabel(type: NotificationType): string {
  switch (type) {
    case "support":
      return "応援";
    case "tester_apply":
      return "テストプレイ参加";
    case "feedback":
      return "フィードバック";
    case "devlog":
      return "開発日誌";
  }
}

export function createNotificationMessage(
  type: NotificationType,
  projectTitle: string,
): string {
  switch (type) {
    case "support":
      return `「${projectTitle}」に応援が届きました`;
    case "tester_apply":
      return `「${projectTitle}」にテストプレイの参加がありました`;
    case "feedback":
      return `「${projectTitle}」にフィードバックが投稿されました`;
    case "devlog":
      return `「${projectTitle}」に開発日誌が投稿されました`;
  }
}

export function sortNotificationsNewestFirst(
  notifications: Notification[],
): Notification[] {
  return [...notifications].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function formatNotificationDate(date: string) {
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
