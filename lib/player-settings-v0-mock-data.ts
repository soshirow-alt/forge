export type SettingsSection = {
  id: string;
  title: string;
  description: string;
  items: { id: string; label: string; description: string; enabled: boolean }[];
};

export const playerSettingsSections: SettingsSection[] = [
  {
    id: "notifications",
    title: "通知",
    description: "どの変化を知らせるかを選べます。",
    items: [
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
    ],
  },
  {
    id: "privacy",
    title: "プライバシー",
    description: "公開範囲の設定（preview mock）。",
    items: [
      { id: "profile", label: "プロフィールを公開", description: "他のプレイヤーから見える", enabled: true },
      { id: "activity", label: "最近の活動を表示", description: "プロフィールに活動を載せる", enabled: true },
      { id: "ranking", label: "ランキングに表示", description: "月間影響度ランキングへの参加", enabled: true },
    ],
  },
  {
    id: "account",
    title: "アカウント",
    description: "ログイン情報（preview mock）。",
    items: [
      { id: "email", label: "メールアドレス", description: "shaneco@example.com", enabled: true },
      { id: "password", label: "パスワード", description: "最終更新: 2025/03/01", enabled: true },
    ],
  },
];
