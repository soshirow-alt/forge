export type NotificationType =
  | "support"
  | "tester_apply"
  | "feedback"
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

export type Notification = {
  id: string;
  type: NotificationType;
  message: string;
  date: string;
  projectId: string;
  projectTitle: string;
  read: boolean;
  seenAt?: string;
  acknowledgedAt?: string;
  requiresAcknowledgement?: boolean;
  coalesceKey?: string;
  consultationId?: string;
  usageRelationId?: string;
  relatedUserId?: string;
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
      return "新しいプレイ可能ver";
    case "confirmation_request":
      return "確認依頼";
    case "project_watched":
      return "作品を追われた";
    case "followed_developer_new_project":
      return "フォロー中のクリエイターの新作";
    case "followed_developer_released_project":
      return "フォロー中のクリエイターの正式版";
    case "feedback_reply":
      return "フィードバックへの返信";
    case "consultation_new":
      return "新しいメッセージ";
    case "consultation_message":
      return "メッセージ";
    case "usage_relation_request":
      return "使用関係の確認";
    case "usage_relation_accepted":
      return "使用関係の承認";
    case "usage_relation_rejected":
      return "使用関係の結果";
    case "feedback_reciprocity":
      return "お返しのフィードバック";
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
      return `「${projectTitle}」の新しいプレイ可能verが公開されました — 再プレイして回答できます`;
    case "confirmation_request":
      return `「${projectTitle}」から確認依頼が届きました`;
    case "project_watched":
      return `誰かが「${projectTitle}」を追い始めました`;
    case "followed_developer_new_project":
      return `フォロー中のクリエイターが新作「${projectTitle}」を公開しました`;
    case "followed_developer_released_project":
      return `フォロー中のクリエイターの「${projectTitle}」が正式版になりました`;
    case "feedback_reply":
      return `「${projectTitle}」のフィードバックに返信がありました`;
    case "consultation_new":
      return "新しいメッセージが届きました";
    case "consultation_message":
      return "新しいメッセージが届きました";
    case "usage_relation_request":
      return "作品の使用関係について確認依頼が届きました";
    case "usage_relation_accepted":
      return "作品の使用関係が承認されました";
    case "usage_relation_rejected":
      return "作品の使用関係は承認されませんでした";
    case "feedback_reciprocity":
      return "お返しにフィードバックしませんか？";
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
      return "新verを確認して再プレイ →";
    case "confirmation_request":
      return "変化を確認する →";
    case "project_watched":
      return "作品を見る →";
    case "followed_developer_new_project":
    case "followed_developer_released_project":
      return "作品詳細を見る →";
    case "feedback_reply":
      return "フィードバックを見る →";
    case "consultation_new":
    case "consultation_message":
      return "メッセージを確認する →";
    case "usage_relation_request":
    case "usage_relation_accepted":
    case "usage_relation_rejected":
      return "使用関係を確認する →";
    case "feedback_reciprocity":
      return "相手の作品を見る →";
  }
}

export function createVersionPublishedMessage(
  projectTitle: string,
  publishedVersion: string,
): string {
  return `「${projectTitle}」のプレイ可能ver ${publishedVersion} が公開されました。もう一度プレイして、新しいver向けに回答できます。`;
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
