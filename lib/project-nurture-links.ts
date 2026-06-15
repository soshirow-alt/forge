import type { Notification } from "@/lib/notifications";

export const PROJECT_STUDIO_FEEDBACK_SECTION_ID = "feedback";

export const GAME_PROJECT_HISTORY_SECTION_ID = "game-project-history";

export const NEW_PLAYABLE_VERSION_BANNER_ID = "new-playable-version-banner";

export function projectStudioPath(projectId: string): string {
  return `/projects/${projectId}/studio`;
}

export function projectStudioFeedbackHref(projectId: string): string {
  return `${projectStudioPath(projectId)}#${PROJECT_STUDIO_FEEDBACK_SECTION_ID}`;
}

export function gameHistoryHref(projectId: string): string {
  return `/games/${projectId}#${GAME_PROJECT_HISTORY_SECTION_ID}`;
}

export function gameVersionBannerHref(projectId: string): string {
  return `/games/${projectId}#${NEW_PLAYABLE_VERSION_BANNER_ID}`;
}

export function gamePlayHref(projectId: string): string {
  return `/games/${projectId}`;
}

export function notificationTargetHref(notification: Notification): string {
  switch (notification.type) {
    case "version_published":
      return gameVersionBannerHref(notification.projectId);
    case "devlog":
      return gameHistoryHref(notification.projectId);
    default:
      return gamePlayHref(notification.projectId);
  }
}

export type ProjectNurtureAction = {
  label: string;
  description: string;
  href: (projectId: string) => string;
};

export const PROJECT_NURTURE_ACTIONS: ProjectNurtureAction[] = [
  {
    label: "届いた回答を見る",
    href: projectStudioFeedbackHref,
    description: "プレイヤーの回答と集計",
  },
  {
    label: "質問を設定する",
    href: (id) => `/projects/${id}/edit#version-prompts`,
    description: "版ごとの質問",
  },
  {
    label: "開発ログを書く",
    href: (id) => `/projects/${id}/devlog/new`,
    description: "改善を記録して公開",
  },
  {
    label: "作品情報を編集する",
    href: (id) => `/projects/${id}/edit`,
    description: "タイトル・説明・公開設定",
  },
  {
    label: "プレイヤー向けページを確認する",
    href: gamePlayHref,
    description: "公開中の見え方",
  },
];
