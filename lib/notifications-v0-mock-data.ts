export type NotificationKind =
  | "empathy"
  | "developer_reply"
  | "update"
  | "follow"
  | "milestone"
  | "developer_post"
  | "new_feedback"
  | "system";

export type NotificationFilterId =
  | "all"
  | "unread"
  | "feedback"
  | "empathy"
  | "update"
  | "follow"
  | "system";

export type NotificationV0Item = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  timeLabel: string;
  read: boolean;
  href?: string;
  thumbnail?: string;
  avatar?: string;
};

export const notificationFilterTabs: { id: NotificationFilterId; label: string }[] = [
  { id: "all", label: "すべて" },
  { id: "unread", label: "未読すべて" },
  { id: "feedback", label: "フィードバック" },
  { id: "empathy", label: "共感 / リアクション" },
  { id: "update", label: "作品 / 更新" },
  { id: "follow", label: "フォロー" },
  { id: "system", label: "システム" },
];

const kindFilterMap: Record<NotificationFilterId, NotificationKind[] | "unread" | "all"> = {
  all: "all",
  unread: "unread",
  feedback: ["new_feedback", "developer_reply"],
  empathy: ["empathy"],
  update: ["update", "developer_post"],
  follow: ["follow"],
  system: ["system", "milestone"],
};

export const mockNotifications: NotificationV0Item[] = [
  {
    id: "n1",
    kind: "empathy",
    title: "フィードバックに共感が付きました",
    body: "「星灯の旅路」へのあなたの声に、5人が共感しました。",
    timeLabel: "5分前",
    read: false,
    href: "/games/seikat-no-tabiji?tab=voices",
    thumbnail: "/images/landing/game-1.png",
  },
  {
    id: "n2",
    kind: "developer_reply",
    title: "開発者から返信がありました",
    body: "Sora Games が「星灯の旅路」に関するあなたのフィードバックに返信しました。",
    timeLabel: "18分前",
    read: false,
    href: "/games/seikat-no-tabiji",
    thumbnail: "/images/landing/game-1.png",
  },
  {
    id: "n3",
    kind: "update",
    title: "フォロー中の作品が更新されました",
    body: "「空島パイオニア」が v0.7.0 に更新されました。",
    timeLabel: "1時間前",
    read: false,
    href: "/games/sorashima-pioneer",
    thumbnail: "/images/landing/game-3.png",
  },
  {
    id: "n4",
    kind: "follow",
    title: "新しいフォロワー",
    body: "ゲーム好き旅人 があなたをフォローしました。",
    timeLabel: "2時間前",
    read: false,
    avatar: "/images/landing/game-4.png",
  },
  {
    id: "n5",
    kind: "empathy",
    title: "フィードバックに共感が付きました",
    body: "「炉心の残光」へのあなたの声に、2人が共感しました。",
    timeLabel: "昨日 22:15",
    read: true,
    href: "/games/roshin-no-zanko?tab=voices",
    thumbnail: "/images/landing/game-2.png",
  },
  {
    id: "n6",
    kind: "milestone",
    title: "実績を獲得しました",
    body: "「初声」バッジを獲得しました。",
    timeLabel: "昨日 18:42",
    read: true,
    href: "/mypage?tab=achievements",
  },
  {
    id: "n7",
    kind: "developer_post",
    title: "フォロー中の開発者が投稿しました",
    body: "GreenSmith が新作「森の中の小さな工房」を公開しました。",
    timeLabel: "昨日 12:30",
    read: true,
    href: "/search",
    thumbnail: "/images/landing/game-5.png",
  },
  {
    id: "n8",
    kind: "new_feedback",
    title: "見届け中の作品に新しい声",
    body: "「夏の向こう側」に新しいフィードバックが届きました。",
    timeLabel: "2日前",
    read: true,
    href: "/games/natsu-no-mukougawa?tab=voices",
    thumbnail: "/images/landing/game-4.png",
  },
  {
    id: "n9",
    kind: "system",
    title: "利用規約を更新しました",
    body: "Forge の利用規約が更新されました。内容をご確認ください。",
    timeLabel: "3日前",
    read: true,
  },
];

export function filterNotifications(
  items: NotificationV0Item[],
  filter: NotificationFilterId,
): NotificationV0Item[] {
  const rule = kindFilterMap[filter];
  if (rule === "all") {
    return items;
  }
  if (rule === "unread") {
    return items.filter((item) => !item.read);
  }
  return items.filter((item) => rule.includes(item.kind));
}

export function countUnread(items: NotificationV0Item[]): number {
  return items.filter((item) => !item.read).length;
}
