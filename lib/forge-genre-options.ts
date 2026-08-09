/**
 * Forge 共通ジャンル一覧（preview v0 正本）
 * プレイヤー好きなジャンル・作品検索・投稿フォームで共用
 * 特徴タグ（ストーリー重視・癒し系等）は forge-feature-tag-options.ts
 */
export const FORGE_GENRE_OPTIONS = [
  "RPG",
  "アクション",
  "アドベンチャー",
  "シミュレーション",
  "パズル",
  "ストラテジー",
  "ホラー",
  "ファンタジー",
  "SF",
  "サバイバル",
  "ノベル",
  "カードゲーム",
  "シューティング",
  "ローグライク",
  "クラフト",
  "探索",
  "経営",
  "カジュアル",
  "メトロイドヴァニア",
  "スポーツ・レース",
] as const;

export type ForgeGenreOption = (typeof FORGE_GENRE_OPTIONS)[number];
