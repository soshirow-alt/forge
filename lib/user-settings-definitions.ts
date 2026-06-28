export type SettingsToggleItem = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

export type PlayerNotificationPrefKey =
  | "watch-updates"
  | "developer-follow"
  | "community"
  | "system";

export type StudioNotificationPrefKey =
  | "voice"
  | "witness"
  | "version-play"
  | "community";

export type PrivacyPrefKey = "profile" | "activity" | "ranking";

export type StudioPublicPrefKey = "dev-profile" | "follower-list" | "activity-log";

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
    voice: true,
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
    "follower-list": true,
    "activity-log": true,
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
  },
  {
    id: "community",
    label: "参加コミュニティ",
    description: "参加申請の承認・却下、承認済みコミュニティからのお知らせ",
    enabled: true,
  },
  {
    id: "system",
    label: "Forge からのお知らせ",
    description: "利用規約の更新、実績バッジなど",
    enabled: false,
  },
];

export const forgeNotificationStudioItems: SettingsToggleItem[] = [
  {
    id: "voice",
    label: "届いたフィードバック",
    description: "作品にフィードバックが届いたとき",
    enabled: true,
  },
  {
    id: "witness",
    label: "見届け人",
    description: "作品の見届け人が増えたとき",
    enabled: true,
  },
  {
    id: "version-play",
    label: "プレイ",
    description: "公開中のverがプレイされたとき",
    enabled: true,
  },
  {
    id: "community",
    label: "コミュニティ",
    description: "参加申請・メンバー管理に関するお知らせ",
    enabled: true,
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
      description: "他のプレイヤーから見える（公開プロフィール実装時に反映）",
      enabled: true,
    },
    {
      id: "activity",
      label: "最近の活動を表示",
      description: "プロフィールに活動を載せる（公開プロフィール実装時に反映）",
      enabled: true,
    },
    {
      id: "ranking",
      label: "ランキングに表示",
      description: "月間影響度ランキングへの参加",
      enabled: true,
    },
  ],
};

export const studioPublicSettingsSection: ForgeSettingsSection = {
  id: "studio-public",
  title: "公開設定",
  description: "開発者としての公開範囲。",
  kind: "toggles",
  items: [
    {
      id: "dev-profile",
      label: "開発者プロフィールを公開",
      description: "作品ページから辿れる /creators/ ページ",
      enabled: true,
    },
    {
      id: "follower-list",
      label: "フォロワー一覧を公開",
      description: "開発者プロフィールのフォロワータブ",
      enabled: true,
    },
    {
      id: "activity-log",
      label: "活動履歴を公開",
      description: "開発者プロフィールの開発ログ・活動",
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
