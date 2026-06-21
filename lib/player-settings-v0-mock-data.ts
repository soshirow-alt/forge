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
      { id: "devlog", label: "開発ログの公開", description: "見届け中の作品が更新されたとき", enabled: true },
      { id: "follow", label: "フォロー中の開発者", description: "新しい作品や更新があったとき", enabled: true },
      { id: "empathy", label: "共感", description: "あなたのフィードバックに共感が付いたとき", enabled: true },
      { id: "system", label: "システム", description: "Forge からのお知らせ", enabled: false },
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
