/**
 * Preview-only fixtures for domain-expansion UI prototypes.
 * Not persisted. Do not treat as production catalog data.
 */

export const DOMAIN_EXPANSION_PROTO_BANNER =
  "プロトタイプ（保存・計測・本番データには接続していません）";

export type WorkCategoryId =
  | "game"
  | "music"
  | "dev_tool"
  | "web_service";

export type WorkCategoryNav = {
  id: WorkCategoryId;
  label: string;
  shortAction: string;
  href: string;
};

export const WORK_CATEGORY_NAV: WorkCategoryNav[] = [
  {
    id: "game",
    label: "ゲーム",
    shortAction: "ゲームを遊ぶ",
    href: "/home?category=game",
  },
  {
    id: "music",
    label: "音楽・音声",
    shortAction: "音楽・音声を聴く",
    href: "/prototype/works?category=music",
  },
  {
    id: "dev_tool",
    label: "開発ツール",
    shortAction: "制作に役立つツールを探す",
    href: "/prototype/works?category=dev_tool",
  },
  {
    id: "web_service",
    label: "サービス・アプリ",
    shortAction: "新しいサービス・アプリを試す",
    href: "/prototype/works?category=web_service",
  },
];

export const WORK_CATEGORY_SUBMIT_OPTIONS: {
  id: WorkCategoryId;
  title: string;
  hint: string;
}[] = [
  {
    id: "game",
    title: "ゲーム・インタラクティブ作品",
    hint: "ブラウザ／ダウンロードで遊べる作品",
  },
  {
    id: "music",
    title: "音楽・音声",
    hint: "楽曲・効果音・ボイスなど、聴いて反応をもらう作品",
  },
  {
    id: "dev_tool",
    title: "開発ツール",
    hint: "制作・開発・運営の作業を支援するプロダクト",
  },
  {
    id: "web_service",
    title: "Webサービス・アプリ",
    hint: "使うこと自体が価値になるサービスやアプリ",
  },
];

export const FB_PURPOSE_OPTIONS = [
  "現在の作品を改善したい",
  "次の更新に活かしたい",
  "別バージョンや追加内容に活かしたい",
  "次回作や今後の制作に活かしたい",
  "利用者の受け取り方を知りたい",
] as const;

export type PrototypeWorkCard = {
  id: string;
  slug: string;
  category: WorkCategoryId;
  categoryLabel: string;
  title: string;
  creator: string;
  lead: string;
  /** Optional image URL; empty = no artwork */
  imageUrl?: string;
  statusLabel: string;
  metaChips: string[];
};

/** Cross-category “注目の作品” — fixed Preview fixtures (not play/RPC ranked). */
export const FEATURED_PROTOTYPE_WORKS: PrototypeWorkCard[] = [
  {
    id: "proto-featured-game",
    slug: "game-sample",
    category: "game",
    categoryLabel: "ゲーム",
    title: "余燼の王国（既存データ例）",
    creator: "灰鉄スタジオ",
    lead: "落ちた余燼が禁断の力を授けるダークファンタジー。",
    statusLabel: "α版",
    metaChips: ["アクションRPG", "ブラウザ"],
  },
  {
    id: "proto-featured-music",
    slug: "music-with-art",
    category: "music",
    categoryLabel: "音楽・音声",
    title: "夜航路のテーマ（試作ミックス）",
    creator: "Proto Audio Lab",
    lead: "ゲーム用BGMの仮ミックス。ループ感と明るさを確認したい。",
    imageUrl: "/images/og-default-v2.png",
    statusLabel: "ミックス調整中",
    metaChips: ["BGM", "ループ"],
  },
  {
    id: "proto-featured-tool",
    slug: "tool-sample",
    category: "dev_tool",
    categoryLabel: "開発ツール",
    title: "Font Pair Preview（プロトタイプ）",
    creator: "Proto Tools",
    lead: "Unity向けフォント組み合わせをその場で試せる補助ツール。",
    statusLabel: "β",
    metaChips: ["Unity", "ブラウザ"],
  },
  {
    id: "proto-featured-service",
    slug: "service-sample",
    category: "web_service",
    categoryLabel: "サービス・アプリ",
    title: "Feedback Board Lite（プロトタイプ）",
    creator: "Proto Apps",
    lead: "小規模チーム向けのフィードバック整理ボード。",
    statusLabel: "無料β",
    metaChips: ["Web", "登録任意"],
  },
];

export const CATEGORY_SHELF_WORKS: Record<WorkCategoryId, PrototypeWorkCard[]> = {
  game: [
    {
      id: "proto-shelf-game-1",
      slug: "game-sample",
      category: "game",
      categoryLabel: "ゲーム",
      title: "虚ろな信号",
      creator: "静電室コレクティブ",
      lead: "一晩で消えた町の真相を暴くホラー探索。",
      statusLabel: "試作ver",
      metaChips: ["ホラー"],
    },
    {
      id: "proto-shelf-game-2",
      slug: "game-sample",
      category: "game",
      categoryLabel: "ゲーム",
      title: "ネオンドリフト",
      creator: "パルスレーンゲームズ",
      lead: "ネオン都市を駆け抜けるアーケードレース。",
      statusLabel: "試作ver",
      metaChips: ["レース"],
    },
  ],
  music: [
    {
      id: "proto-shelf-music-1",
      slug: "music-with-art",
      category: "music",
      categoryLabel: "音楽・音声",
      title: "夜航路のテーマ（試作ミックス）",
      creator: "Proto Audio Lab",
      lead: "ループBGMの仮ミックス。",
      imageUrl: "/images/og-default-v2.png",
      statusLabel: "ミックス調整中",
      metaChips: ["BGM"],
    },
    {
      id: "proto-shelf-music-2",
      slug: "music-no-art-title",
      category: "music",
      categoryLabel: "音楽・音声",
      title: "足音セット A（プロトタイプ）",
      creator: "Proto Audio Lab",
      lead: "屋内・屋外の足音バリエーション。",
      statusLabel: "素材候補",
      metaChips: ["効果音"],
    },
  ],
  dev_tool: [
    {
      id: "proto-shelf-tool-1",
      slug: "tool-sample",
      category: "dev_tool",
      categoryLabel: "開発ツール",
      title: "Font Pair Preview",
      creator: "Proto Tools",
      lead: "フォント組み合わせの試用ツール。",
      statusLabel: "β",
      metaChips: ["Unity"],
    },
  ],
  web_service: [
    {
      id: "proto-shelf-service-1",
      slug: "service-sample",
      category: "web_service",
      categoryLabel: "サービス・アプリ",
      title: "Feedback Board Lite",
      creator: "Proto Apps",
      lead: "FB整理用の軽いボード。",
      statusLabel: "無料β",
      metaChips: ["Web"],
    },
  ],
};

export type PrototypeDetailFixture = {
  slug: string;
  category: WorkCategoryId;
  categoryLabel: string;
  title: string;
  creator: string;
  creatorHref: string;
  lead: string;
  audience: string;
  statusLabel: string;
  tryInfo: string;
  authorFocus: string;
  fbPurposes: string[];
  primaryCta: string;
  secondaryCtaHint: string;
  /** artwork | generated | title_centric */
  mediaMode: "artwork" | "generated" | "title_centric";
  imageUrl?: string;
  mediaKindLabel?: string;
};

export const PROTOTYPE_DETAIL_FIXTURES: Record<string, PrototypeDetailFixture> = {
  "game-sample": {
    slug: "game-sample",
    category: "game",
    categoryLabel: "ゲーム",
    title: "余燼の王国",
    creator: "灰鉄スタジオ",
    creatorHref: "/search/creators",
    lead: "落ちた余燼が禁断の力を授けるダークファンタジーアクションRPG。",
    audience: "アクションRPGが好きなプレイヤー",
    statusLabel: "α版",
    tryInfo: "ブラウザで無料デモをプレイ（約30分）",
    authorFocus: "序盤の戦闘テンポと、UIの分かりやすさ",
    fbPurposes: ["現在の作品を改善したい", "次の更新に活かしたい"],
    primaryCta: "プレイする",
    secondaryCtaHint: "ブラウザでプレイ",
    mediaMode: "artwork",
    imageUrl: "/images/og-default-v2.png",
  },
  "music-with-art": {
    slug: "music-with-art",
    category: "music",
    categoryLabel: "音楽・音声",
    title: "夜航路のテーマ（試作ミックス）",
    creator: "Proto Audio Lab",
    creatorHref: "/search/creators",
    lead: "探索パート用BGMの仮ミックス。ループの継ぎ目と明るさを確認したい。",
    audience: "ゲーム・映像向けBGMを探す制作者",
    statusLabel: "ミックス調整中",
    tryInfo: "YouTubeで約1:20の試聴（プロトタイプ表示）",
    authorFocus: "ループ感・明るさ・ゲーム画面との相性",
    fbPurposes: [
      "現在の作品を改善したい",
      "別バージョンや追加内容に活かしたい",
    ],
    primaryCta: "聴く",
    secondaryCtaHint: "YouTubeで聴く",
    mediaMode: "artwork",
    imageUrl: "/images/og-default-v2.png",
    mediaKindLabel: "BGM / ループ",
  },
  "music-no-art-generated": {
    slug: "music-no-art-generated",
    category: "music",
    categoryLabel: "音楽・音声",
    title: "仮歌デモ — 港の灯",
    creator: "Proto Audio Lab",
    creatorHref: "/search/creators",
    lead: "ボーカル入りデモ。歌詞の伝わり方と声の距離感を知りたい。",
    audience: "インディーゲーム向け楽曲を探す人",
    statusLabel: "デモ",
    tryInfo: "SoundCloudで試聴（プロトタイプ表示）",
    authorFocus: "仮歌の印象・フル版に進める価値があるか",
    fbPurposes: [
      "次回作や今後の制作に活かしたい",
      "利用者の受け取り方を知りたい",
    ],
    primaryCta: "聴く",
    secondaryCtaHint: "SoundCloudで聴く",
    mediaMode: "generated",
    mediaKindLabel: "ボーカルデモ",
  },
  "music-no-art-title": {
    slug: "music-no-art-title",
    category: "music",
    categoryLabel: "音楽・音声",
    title: "足音セット A",
    creator: "Proto Audio Lab",
    creatorHref: "/search/creators",
    lead: "屋内・砂利・金属床の足音バリエーション。用途の向きを確認したい。",
    audience: "効果音を探すゲーム制作者",
    statusLabel: "素材候補",
    tryInfo: "サンプルZIPへのリンク想定（プロトタイプ）",
    authorFocus: "用途の分かりやすさ・足りないバリエーション",
    fbPurposes: ["利用者の受け取り方を知りたい"],
    primaryCta: "聴く",
    secondaryCtaHint: "サンプルを開く",
    mediaMode: "title_centric",
    mediaKindLabel: "効果音",
  },
  "tool-sample": {
    slug: "tool-sample",
    category: "dev_tool",
    categoryLabel: "開発ツール",
    title: "Font Pair Preview",
    creator: "Proto Tools",
    creatorHref: "/search/creators",
    lead: "Unity向けにフォント組み合わせをブラウザ上で試せる補助ツール。",
    audience: "UnityでUIを組む個人・小規模チーム",
    statusLabel: "β",
    tryInfo: "ブラウザで無料試用（アカウント不要）",
    authorFocus: "導入の分かりやすさ・欲しいプリセット",
    fbPurposes: ["現在の作品を改善したい", "次の更新に活かしたい"],
    primaryCta: "使ってみる",
    secondaryCtaHint: "Web版を開く",
    mediaMode: "artwork",
    imageUrl: "/images/og-default-v2.png",
  },
  "service-sample": {
    slug: "service-sample",
    category: "web_service",
    categoryLabel: "サービス・アプリ",
    title: "Feedback Board Lite",
    creator: "Proto Apps",
    creatorHref: "/search/creators",
    lead: "届いたフィードバックをテーマ別に整理する軽いボード。",
    audience: "少人数のインディー開発チーム",
    statusLabel: "無料β",
    tryInfo: "Web版・登録任意・5分で試せる想定",
    authorFocus: "オンボーディングと「整理できた」感覚",
    fbPurposes: [
      "現在の作品を改善したい",
      "利用者の受け取り方を知りたい",
    ],
    primaryCta: "試してみる",
    secondaryCtaHint: "Web版を開く",
    mediaMode: "artwork",
    imageUrl: "/images/og-default-v2.png",
  },
};

export const PROTOTYPE_DETAIL_COMPARE_LINKS: {
  label: string;
  href: string;
}[] = [
  { label: "ゲーム", href: "/prototype/works/game-sample" },
  { label: "音楽・音声（アートあり）", href: "/prototype/works/music-with-art" },
  {
    label: "音楽・音声（生成fallback）",
    href: "/prototype/works/music-no-art-generated",
  },
  {
    label: "音楽・音声（タイトル中心）",
    href: "/prototype/works/music-no-art-title",
  },
  { label: "開発ツール", href: "/prototype/works/tool-sample" },
  { label: "サービス・アプリ", href: "/prototype/works/service-sample" },
];

export function categoryLabel(id: WorkCategoryId): string {
  return WORK_CATEGORY_NAV.find((item) => item.id === id)?.label ?? id;
}
