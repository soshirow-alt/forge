export type SettingsToggleItem = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  /**
   * UI-only gate: toggle is visible but not operable.
   * Reasons vary — unwired prefs, or wired prefs whose product surface is inactive.
   */
  comingSoon?: boolean;
  comingSoonNote?: string;
};

/** Notification prefs saved but not yet enforced in send paths. */
const NOTIFY_COMING_SOON_NOTE =
  "近日対応予定（現在はまだ通知には反映されません）";

/** Privacy prefs with no product read path yet (profile / activity). */
const PRIVACY_UNWIRED_NOTE =
  "近日対応予定（現在はまだ公開範囲の設定には反映されません）";

/**
 * privacy.ranking is stored and enforced in get_monthly_player_influence_ranking,
 * but the ranking feature is inactive/unpublished in the product for now.
 */
const PRIVACY_RANKING_INACTIVE_NOTE =
  "近日対応予定（ランキング機能は現時点では非活性のため、この設定はまだ利用できません）";

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
    comingSoonNote: NOTIFY_COMING_SOON_NOTE,
  },
  {
    id: "community",
    label: "参加コミュニティ",
    description: "参加申請の承認・却下、承認済みコミュニティからのお知らせ",
    enabled: true,
    comingSoon: true,
    comingSoonNote: NOTIFY_COMING_SOON_NOTE,
  },
  {
    id: "system",
    label: "Forge からのお知らせ",
    description: "利用規約の更新、実績バッジなど",
    enabled: false,
    comingSoon: true,
    comingSoonNote: NOTIFY_COMING_SOON_NOTE,
  },
];

export const forgeNotificationStudioItems: SettingsToggleItem[] = [
  {
    id: "witness",
    label: "見届け人",
    description: "作品の見届け人が増えたとき",
    enabled: true,
    comingSoon: true,
    comingSoonNote: NOTIFY_COMING_SOON_NOTE,
  },
  {
    id: "version-play",
    label: "プレイ",
    description: "公開中のverがプレイされたとき",
    enabled: true,
    comingSoon: true,
    comingSoonNote: NOTIFY_COMING_SOON_NOTE,
  },
  {
    id: "community",
    label: "コミュニティ",
    description: "参加申請・メンバー管理に関するお知らせ",
    enabled: true,
    comingSoon: true,
    comingSoonNote: NOTIFY_COMING_SOON_NOTE,
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
      comingSoonNote: PRIVACY_UNWIRED_NOTE,
    },
    {
      id: "activity",
      label: "最近の活動を表示",
      description: "プロフィールに活動を載せる",
      enabled: true,
      comingSoon: true,
      comingSoonNote: PRIVACY_UNWIRED_NOTE,
    },
    {
      id: "ranking",
      label: "ランキングに表示",
      description: "月間影響度ランキングへの参加（機能公開時に利用可能）",
      enabled: true,
      comingSoon: true,
      comingSoonNote: PRIVACY_RANKING_INACTIVE_NOTE,
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
