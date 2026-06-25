import { PROJECT_STUDIO_FEEDBACK_SECTION_ID } from "@/lib/project-nurture-links";
import {
  isStudioMockProjectId,
  studioProjectHref,
} from "@/lib/studio-projects-v0-mock-data";

export type StudioNotificationKind =
  | "new_voice"
  | "witness"
  | "version_play"
  | "devlog_reaction"
  | "release"
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
    title: "新しいフィードバックが届きました",
    body: "3件の新しいフィードバックが届いています。未確認のフィードバックを確認しましょう。",
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
  {
    id: "sn-4",
    kind: "devlog_reaction",
    title: "Devlog に反応がありました",
    body: "更新報告に 8件の反応があります。",
    projectTitle: "炉心の残光",
    projectId: "roshin-no-zanko",
    timeLabel: "昨日",
    unread: false,
    tab: "devlog",
  },
  {
    id: "sn-5",
    kind: "release",
    title: "正式verの反応",
    body: "正式ver公開後、見届け人が増え続けています。",
    projectTitle: "夏の向こう側",
    projectId: "natsu-no-mukougawa",
    timeLabel: "3日前",
    unread: false,
    tab: "release",
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
