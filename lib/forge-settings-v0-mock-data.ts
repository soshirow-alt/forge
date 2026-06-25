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

/** 通知は1画面・Player / Studio をそれぞれ設定（preview mock 初期値） */
export const forgeNotificationPlayerItems: SettingsToggleItem[] = [
  { id: "devlog", label: "開発ログの公開", description: "見届け中の作品が更新されたとき", enabled: true },
  { id: "follow", label: "フォロー中の開発者", description: "新しい作品や更新があったとき", enabled: true },
  { id: "empathy", label: "共感", description: "あなたのフィードバックに共感が付いたとき", enabled: true },
  { id: "system", label: "システム", description: "Forge からのお知らせ", enabled: false },
];

export const forgeNotificationStudioItems: SettingsToggleItem[] = [
  { id: "new-voice", label: "新しいフィードバック", description: "作品にフィードバックが届いたとき", enabled: true },
  { id: "witness", label: "見届け人の増加", description: "見届け人が増えたとき", enabled: true },
  { id: "version-play", label: "最新verのプレイ", description: "公開中のverがプレイされたとき", enabled: true },
  { id: "devlog-reaction", label: "Devlog の反応", description: "開発ログに反応があったとき", enabled: true },
  { id: "release", label: "正式ver関連", description: "正式ver公開・Reopen の記録", enabled: true },
];

export const forgeSettingsSections: ForgeSettingsSection[] = [
  {
    id: "account",
    title: "アカウント",
    description: "ログイン情報（preview mock）。",
    kind: "actions",
    items: [
      { id: "email", label: "メールアドレス", description: "shaneco@example.com" },
      { id: "password", label: "パスワード", description: "最終更新: 2025/03/01" },
    ],
  },
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
