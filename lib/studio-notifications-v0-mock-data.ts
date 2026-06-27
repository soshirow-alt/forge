import { PROJECT_STUDIO_FEEDBACK_SECTION_ID } from "@/lib/project-nurture-links";
import {
  isStudioMockProjectId,
  studioProjectHref,
} from "@/lib/studio-projects-v0-mock-data";

export type StudioNotificationKind =
  | "new_voice"
  | "witness"
  | "version_play"
  | "community_join_request";

export type StudioNotificationItem = {
  id: string;
  kind: StudioNotificationKind;
  title: string;
  body: string;
  projectTitle: string;
  projectId: string;
  timeLabel: string;
  unread: boolean;
  tab?: string;
};

export const studioNotifications: StudioNotificationItem[] = [
  {
    id: "sn-1",
    kind: "new_voice",
    title: "プレイヤーの声が届きました",
    body: "3件の声が届いています。未確認の声を確認しましょう。",
    projectTitle: "星の記憶",
    projectId: "hoshino-kioku",
    timeLabel: "2時間前",
    unread: true,
    tab: "voices-raw",
  },
  {
    id: "sn-2",
    kind: "witness",
    title: "見届け人が増えました",
    body: "見届け人が 5人増えました。",
    projectTitle: "星灯の旅路",
    projectId: "seito-no-tabiji",
    timeLabel: "5時間前",
    unread: true,
  },
  {
    id: "sn-3",
    kind: "version_play",
    title: "最新verがプレイされました",
    body: "v0.4.0 が 12回プレイされました。",
    projectTitle: "星灯の旅路",
    projectId: "seito-no-tabiji",
    timeLabel: "昨日",
    unread: true,
    tab: "devlog",
  },
];

export function countStudioUnread(items: StudioNotificationItem[]): number {
  return items.filter((item) => item.unread).length;
}

export function studioNotificationHref(item: StudioNotificationItem): string {
  if (item.kind === "community_join_request") {
    return "/studio/community?tab=members";
  }
  const base = studioProjectHref(item.projectId);
  if (item.tab === "voices-raw") {
    if (isStudioMockProjectId(item.projectId)) {
      return `${base}?tab=voices-raw`;
    }
    return `${base}#${PROJECT_STUDIO_FEEDBACK_SECTION_ID}`;
  }
  if (item.tab && isStudioMockProjectId(item.projectId)) {
    return `${base}?tab=${item.tab}`;
  }
  return base;
}
