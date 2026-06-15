export type NotificationType =
  | "support"
  | "tester_apply"
  | "feedback"
  | "devlog"
  | "version_published"
  | "voice_received";

export type Notification = {
  id: string;
  type: NotificationType;
  message: string;
  date: string;
  projectId: string;
  projectTitle: string;
  read: boolean;
  publishedVersion?: string;
};

export function getNotificationTypeLabel(type: NotificationType): string {
  switch (type) {
    case "support":
      return "応援";
    case "tester_apply":
      return "テストプレイ参加";
    case "feedback":
      return "回答";
    case "voice_received":
      return "プレイヤーの回答";
    case "devlog":
      return "開発日誌";
    case "version_published":
      return "新しいプレイ可能版";
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
      return `「${projectTitle}」にプレイヤーの回答が届きました`;
    case "voice_received":
      return `「${projectTitle}」にプレイヤーの回答が届きました`;
    case "devlog":
      return `「${projectTitle}」が更新されました — 開発ログを公開`;
    case "version_published":
      return `「${projectTitle}」の新しいプレイ可能版が公開されました — 再プレイして回答できます`;
  }
}

/** 通知カード下に表示する次アクション文言 */
export function getNotificationActionHint(type: NotificationType): string {
  switch (type) {
    case "support":
      return "作品詳細を見る →";
    case "tester_apply":
      return "作品詳細を見る →";
    case "feedback":
      return "届いた回答を見る →";
    case "voice_received":
      return "届いた回答を見る →";
    case "devlog":
      return "開発の歩みを見る →";
    case "version_published":
      return "新版を確認して再プレイ →";
  }
}

export function createVersionPublishedMessage(
  projectTitle: string,
  publishedVersion: string,
): string {
  return `「${projectTitle}」のプレイ可能版 ${publishedVersion} が公開されました。もう一度プレイして、新しい版向けに回答できます。`;
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
