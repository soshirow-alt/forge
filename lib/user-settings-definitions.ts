export type SettingsToggleItem = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  /** Saved in DB but not yet wired to product behavior. */
  comingSoon?: boolean;
  comingSoonNote?: string;
};

const COMING_SOON_NOTE =
  "近日対応予定（現在はまだ通知・公開範囲には反映されません）";

export type PlayerNotificationPrefKey =
  | "watch-updates"
  | "developer-follow"
  | "community"
  | "system";

export type StudioNotificationPrefKey = "witness" | "version-play" | "community";

export type PrivacyPrefKey = "profile" | "activity" | "ranking";

export type StudioPublicPrefKey = "dev-profile";

export type UserSettings = {
  notifyPlayer: Record<PlayerNotificationPrefKey, boolean>;
  notifyStudio: Record<StudioNotificationPrefKey, boolean>;
  privacy: Record<PrivacyPrefKey, boolean>;
  studioPublic: Record<StudioPublicPrefKey, boolean>;
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  notifyPlayer: {
    "watch-updates": true,
    "developer-follow": true,
    community: true,
    system: false,
  },
  notifyStudio: {
    witness: true,
    "version-play": true,
    community: true,
  },
  privacy: {
    profile: true,
    activity: true,
    ranking: true,
  },
  studioPublic: {
    "dev-profile": true,
  },
};

export const forgeNotificationPlayerItems: SettingsToggleItem[] = [
  {
    id: "watch-updates",
    label: "更新を追っている作品",
    description: "「更新を追う」をONにした作品の開発ログ・新版公開・確認依頼",
    enabled: true,
  },
  {
    id: "developer-follow",
    label: "フォロー中の開発者",
    description: "フォローした開発者が新作を公開したとき",
    enabled: true,
    comingSoon: true,
    comingSoonNote: COMING_SOON_NOTE,
  },
  {
    id: "community",
    label: "参加コミュニティ",
    description: "参加申請の承認・却下、承認済みコミュニティからのお知らせ",
    enabled: true,
    comingSoon: true,
    comingSoonNote: COMING_SOON_NOTE,
  },
  {
    id: "system",
    label: "Forge からのお知らせ",
    description: "利用規約の更新、実績バッジなど",
    enabled: false,
    comingSoon: true,
    comingSoonNote: COMING_SOON_NOTE,
  },
];

export const forgeNotificationStudioItems: SettingsToggleItem[] = [
  {
    id: "witness",
    label: "見届け人",
    description: "作品の見届け人が増えたとき",
    enabled: true,
    comingSoon: true,
    comingSoonNote: COMING_SOON_NOTE,
  },
  {
    id: "version-play",
    label: "プレイ",
    description: "公開中のverがプレイされたとき",
    enabled: true,
    comingSoon: true,
    comingSoonNote: COMING_SOON_NOTE,
  },
  {
    id: "community",
    label: "コミュニティ",
    description: "参加申請・メンバー管理に関するお知らせ",
    enabled: true,
    comingSoon: true,
    comingSoonNote: COMING_SOON_NOTE,
  },
];

export type ForgeSettingsSection = {
  id: string;
  title: string;
  description: string;
  kind: "toggles";
  items: SettingsToggleItem[];
};

export const privacySettingsSection: ForgeSettingsSection = {
  id: "privacy",
  title: "プライバシー",
  description: "プレイヤーとしての公開範囲。",
  kind: "toggles",
  items: [
    {
      id: "profile",
      label: "プロフィールを公開",
      description: "他のプレイヤーから見える",
      enabled: true,
      comingSoon: true,
      comingSoonNote: COMING_SOON_NOTE,
    },
    {
      id: "activity",
      label: "最近の活動を表示",
      description: "プロフィールに活動を載せる",
      enabled: true,
      comingSoon: true,
      comingSoonNote: COMING_SOON_NOTE,
    },
    {
      id: "ranking",
      label: "ランキングに表示",
      description: "月間影響度ランキングへの参加",
      enabled: true,
      comingSoon: true,
      comingSoonNote: COMING_SOON_NOTE,
    },
  ],
};

export const studioPublicSettingsSection: ForgeSettingsSection = {
  id: "studio-public",
  title: "公開設定",
  description: "開発者プロフィールページ（/creators/）を公開するかどうか。",
  kind: "toggles",
  items: [
    {
      id: "dev-profile",
      label: "開発者プロフィールを公開",
      description: "OFF にすると /creators/ ページは非公開（作品ページからは辿れません）",
      enabled: true,
    },
  ],
};

export function mergeSettingsToggleItems(
  definitions: SettingsToggleItem[],
  values: Record<string, boolean>,
): SettingsToggleItem[] {
  return definitions.map((item) => ({
    ...item,
    enabled: values[item.id] ?? item.enabled,
  }));
}

export function settingsItemsToRecord(
  items: SettingsToggleItem[],
): Record<string, boolean> {
  return Object.fromEntries(items.map((item) => [item.id, item.enabled]));
}
