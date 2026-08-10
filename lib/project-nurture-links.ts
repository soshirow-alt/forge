import type { Notification } from "@/lib/notifications";
import { buildGameDetailTabHref } from "@/lib/game-detail-tabs";
import { studioOverviewEditHref } from "@/lib/studio-edit-url";

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

/** Studio owner preview → 「みんなのフィードバック」タブ */
export function projectStudioVoicesHref(projectId: string): string {
  return `${projectStudioPath(projectId)}?tab=voices`;
}

/** @deprecated 旧モーダル導線 — /studio/submit へリダイレクト用 */
export const STUDIO_SUBMIT_SEARCH_PARAM = "submit";

/** Studio 新規投稿ページ */
export function studioSubmitModalHref(options?: { query?: string }): string {
  if (options?.query?.trim()) {
    return `/studio/submit?q=${encodeURIComponent(options.query.trim())}`;
  }
  return "/studio/submit";
}

export function projectStudioDevlogHref(projectId: string): string {
  return `${projectStudioPath(projectId)}?devlog=1`;
}

export function projectStudioFeedbackHref(projectId: string): string {
  return `${projectStudioPath(projectId)}#${PROJECT_STUDIO_FEEDBACK_SECTION_ID}`;
}

export function gameDevlogTabHref(projectId: string): string {
  return buildGameDetailTabHref(projectId, "devlog");
}

/** @deprecated 旧 hash 導線 — 現行 v0 詳細は開発ログタブへ */
export function gameHistoryHref(projectId: string): string {
  return gameDevlogTabHref(projectId);
}

/** @deprecated 旧 hash 導線 — 新版公開も開発ログタブで確認 */
export function gameVersionBannerHref(projectId: string): string {
  return gameDevlogTabHref(projectId);
}

export function gamePlayHref(projectId: string): string {
  return `/games/${projectId}`;
}

export function mypageUpdatesHref(projectId?: string): string {
  if (projectId?.trim()) {
    return `/mypage?tab=witnessing&project=${encodeURIComponent(projectId.trim())}`;
  }
  return `/mypage?tab=witnessing`;
}

export function notificationTargetHref(notification: Notification): string {
  if (
    (notification.type === "consultation_new" ||
      notification.type === "consultation_message") &&
    notification.consultationId
  ) {
    return `/consultations/${notification.consultationId}`;
  }
  if (notification.type === "usage_relation_request") {
    return "/consultations#usage-relations";
  }
  if (
    notification.type === "usage_relation_accepted" ||
    notification.type === "usage_relation_rejected"
  ) {
    // Deep-link so >20 pending result badges can still focus + ack the exact relation.
    if (notification.usageRelationId) {
      return `/consultations#usage-relation-${notification.usageRelationId}`;
    }
    return "/consultations#usage-relations";
  }
  if (notification.type === "feedback_reciprocity" && notification.relatedUserId) {
    return `/creators/${notification.relatedUserId}`;
  }
  const projectId = notification.projectId;
  if (!projectId) return "/notifications";
  switch (notification.type) {
    case "confirmation_request":
      return gameChangeCheckHref(projectId);
    case "version_published":
      return gameVersionBannerHref(projectId);
    case "devlog":
      return gameHistoryHref(projectId);
    case "feedback":
      return projectStudioFeedbackHref(projectId);
    case "voice_received":
      return projectStudioFeedbackHref(projectId);
    case "project_watched":
      return projectStudioPath(projectId);
    case "followed_developer_new_project":
    case "followed_developer_released_project":
      return gamePlayHref(projectId);
    case "feedback_reply":
      return `${gamePlayHref(projectId)}?tab=voices`;
    default:
      return gamePlayHref(projectId);
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
    href: projectStudioDevlogHref,
    description: "新verの開発ログから設定",
  },
  {
    id: "write-devlog",
    label: "新verの開発ログ",
    href: projectStudioDevlogHref,
    description: "変更の記録と新ver公開",
  },
  {
    id: "edit-project",
    label: "作品情報を編集する",
    href: (id) => studioOverviewEditHref(id, "basic-info"),
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
