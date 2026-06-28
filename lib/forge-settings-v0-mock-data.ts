export type SettingsToggleItem = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

export type SettingsActionItem = {
  id: string;
  label: string;
  description: string;
};

export type ForgeSettingsSection = {
  id: string;
  title: string;
  description: string;
  kind: "toggles" | "actions";
  items: SettingsToggleItem[] | SettingsActionItem[];
};

/**
 * 通知は1画面・Player / Studio をそれぞれ設定（preview mock 初期値）。
 * 種別は重ならないよう整理。実配信は Supabase + v0 拡張（コミュニティ等）に対応予定。
 */
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

export const forgeSettingsSections: ForgeSettingsSection[] = [
  {
    id: "privacy",
    title: "プライバシー",
    description: "プレイヤーとしての公開範囲。",
    kind: "toggles",
    items: [
      { id: "profile", label: "プロフィールを公開", description: "他のプレイヤーから見える", enabled: true },
      { id: "activity", label: "最近の活動を表示", description: "プロフィールに活動を載せる", enabled: true },
      { id: "ranking", label: "ランキングに表示", description: "月間影響度ランキングへの参加", enabled: true },
    ],
  },
  {
    id: "studio-public",
    title: "公開設定",
    description: "開発者としての公開範囲。",
    kind: "toggles",
    items: [
      { id: "dev-profile", label: "開発者プロフィールを公開", description: "作品ページから辿れる", enabled: true },
      { id: "follower-list", label: "フォロワー一覧を公開", description: "Studio マイページに表示", enabled: true },
      { id: "activity-log", label: "活動履歴を公開", description: "投稿・Devlog・正式verの履歴", enabled: true },
    ],
  },
];
