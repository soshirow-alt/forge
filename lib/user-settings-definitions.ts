export type SettingsToggleItem = {
  id: string;
  label: string;
  enabled: boolean;
  /**
   * UI-only gate: toggle is visible but not operable.
   * Reasons vary — unwired prefs, or wired prefs whose product surface is inactive.
   */
  comingSoon?: boolean;
  /** Shown only via the "?" help control — not in normal settings layout. */
  helpText?: string;
};

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
    label: "追っている作品の更新",
    enabled: true,
  },
  {
    id: "developer-follow",
    label: "フォロー中の開発者の新作・正式版公開",
    enabled: true,
  },
  {
    id: "community",
    label: "参加コミュニティの更新",
    enabled: true,
    comingSoon: true,
  },
  {
    id: "system",
    label: "Forgeからのお知らせ",
    enabled: false,
    comingSoon: true,
  },
];

export const forgeNotificationStudioItems: SettingsToggleItem[] = [
  {
    id: "witness",
    label: "作品フォロー",
    enabled: true,
    helpText: "あなたの作品が新しくフォローされたとき",
  },
  {
    id: "version-play",
    label: "初プレイ・ver更新後プレイ",
    enabled: true,
    comingSoon: true,
    helpText: "初めて遊ばれたときや、ver更新後に初めて遊ばれたとき",
  },
  {
    id: "community",
    label: "コミュニティの申請・反応",
    enabled: true,
    comingSoon: true,
  },
];

export type ForgeSettingsSection = {
  id: string;
  title: string;
  kind: "toggles";
  items: SettingsToggleItem[];
};

export const privacySettingsSection: ForgeSettingsSection = {
  id: "privacy",
  title: "プライバシー",
  kind: "toggles",
  items: [
    {
      id: "profile",
      label: "プロフィールの公開",
      enabled: true,
      comingSoon: true,
      helpText: "公開プロフィールに表示する情報",
    },
    {
      id: "activity",
      label: "最近の活動の表示",
      enabled: true,
      comingSoon: true,
      helpText: "最近遊んだ作品やFBなどの活動表示",
    },
    {
      id: "ranking",
      label: "ランキングへの表示",
      enabled: true,
      comingSoon: true,
      // DB/RPC: privacy.ranking is wired in get_monthly_player_influence_ranking,
      // but the ranking product surface is inactive — keep Coming Soon in UI.
      helpText: "ランキングに自分を表示するかどうか",
    },
  ],
};

export const studioPublicSettingsSection: ForgeSettingsSection = {
  id: "studio-public",
  title: "公開設定",
  kind: "toggles",
  items: [
    {
      id: "dev-profile",
      label: "開発者プロフィールを公開",
      enabled: true,
      helpText: "開発者プロフィールページ（/creators/）を公開するかどうか",
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
