import type { Notification } from "@/lib/notifications";

export const PROJECT_STUDIO_FEEDBACK_SECTION_ID = "feedback";

export const GAME_PROJECT_HISTORY_SECTION_ID = "game-project-history";

export const NEW_PLAYABLE_VERSION_BANNER_ID = "new-playable-version-banner";

export const MYPAGE_UPDATES_SECTION_ID = "updates";

export const VOICE_ADOPTIONS_SECTION_ID = "voice-adoptions";

export const ADOPTION_VERIFY_SECTION_ID = "adoption-verify";

export { CHANGE_CHECK_SECTION_ID } from "@/lib/change-check-types";

export function gameChangeCheckHref(projectId: string): string {
  return `/games/${projectId}#change-check-card`;
}

export function adoptionVerifyHref(projectId: string, adoptionId: string): string {
  return `/games/${projectId}?adoption=${encodeURIComponent(adoptionId)}#${ADOPTION_VERIFY_SECTION_ID}`;
}

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

export function mypageUpdatesHref(): string {
  return `/mypage#${MYPAGE_UPDATES_SECTION_ID}`;
}

export function notificationTargetHref(notification: Notification): string {
  switch (notification.type) {
    case "confirmation_request":
      return gameChangeCheckHref(notification.projectId);
    case "version_published":
      return gameVersionBannerHref(notification.projectId);
    case "devlog":
      return gameHistoryHref(notification.projectId);
    case "feedback":
      return projectStudioFeedbackHref(notification.projectId);
    case "voice_received":
      return projectStudioFeedbackHref(notification.projectId);
    default:
      return gamePlayHref(notification.projectId);
  }
}

export type ProjectNurtureAction = {
  id: string;
  label: string;
  description: string;
  href: (projectId: string) => string;
};

export const PROJECT_NURTURE_ACTIONS: ProjectNurtureAction[] = [
  {
    id: "read-answers",
    label: "届いた回答を見る",
    href: projectStudioFeedbackHref,
    description: "プレイヤーの回答と集計",
  },
  {
    id: "edit-prompts",
    label: "プレイヤーへの問い",
    href: (id) => `/projects/${id}/devlog/new#version-prompts`,
    description: "開発ログから ver ごとに設定",
  },
  {
    id: "write-devlog",
    label: "開発ログを書く",
    href: (id) => `/projects/${id}/devlog/new`,
    description: "改善を記録して公開",
  },
  {
    id: "edit-project",
    label: "作品情報を編集する",
    href: (id) => `${projectStudioPath(id)}?edit=project`,
    description: "タイトル・説明・公開設定",
  },
  {
    id: "preview-player",
    label: "プレイヤー向けページを確認する",
    href: gamePlayHref,
    description: "公開中の見え方",
  },
];

const STUDIO_ACTION_IDS = new Set(["edit-project", "write-devlog"]);

export function getProjectNurtureActions(context: "studio" | "default") {
  if (context === "studio") {
    return PROJECT_NURTURE_ACTIONS.filter((action) =>
      STUDIO_ACTION_IDS.has(action.id),
    );
  }

  return PROJECT_NURTURE_ACTIONS;
}
