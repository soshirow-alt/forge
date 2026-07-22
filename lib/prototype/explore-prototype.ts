/**
 * Preview-only Explore category prototype fixtures.
 * Not connected to Supabase / RPC / production catalog.
 */

export const EXPLORE_PROTOTYPE_CATEGORY_SLUGS = [
  "game",
  "audio",
  "dev-tool",
  "service-app",
] as const;

export type ExplorePrototypeCategorySlug =
  (typeof EXPLORE_PROTOTYPE_CATEGORY_SLUGS)[number];

export type ExplorePrototypePhase =
  | "正式版公開済み"
  | "試作版"
  | "α版"
  | "β版";

export type ExplorePrototypeCategoryMeta = {
  slug: ExplorePrototypeCategorySlug;
  label: string;
  description: string;
  ctaLabel: string;
  href: string;
  fallbackSrc: string;
};

export const EXPLORE_PROTOTYPE_CATEGORIES: ExplorePrototypeCategoryMeta[] = [
  {
    slug: "game",
    label: "ゲーム・インタラクティブ作品",
    description: "ゲームや操作して楽しむ作品",
    ctaLabel: "遊ぶ",
    href: "/explore/prototype/game",
    fallbackSrc: "/images/explore-prototype/fallback/game.svg",
  },
  {
    slug: "audio",
    label: "音楽・音声",
    description: "楽曲・BGM・効果音・ボイス",
    ctaLabel: "聴く",
    href: "/explore/prototype/audio",
    fallbackSrc: "/images/explore-prototype/fallback/audio.svg",
  },
  {
    slug: "dev-tool",
    label: "開発ツール",
    description: "制作や開発を助けるツール",
    ctaLabel: "利用する",
    href: "/explore/prototype/dev-tool",
    fallbackSrc: "/images/explore-prototype/fallback/dev-tool.svg",
  },
  {
    slug: "service-app",
    label: "Webサービス・アプリ",
    description: "Webサービスや各種アプリ",
    ctaLabel: "利用する",
    href: "/explore/prototype/service-app",
    fallbackSrc: "/images/explore-prototype/fallback/service-app.svg",
  },
];

export function getExplorePrototypeCategory(
  slug: string,
): ExplorePrototypeCategoryMeta | undefined {
  return EXPLORE_PROTOTYPE_CATEGORIES.find((item) => item.slug === slug);
}

export function isExplorePrototypeCategorySlug(
  value: string,
): value is ExplorePrototypeCategorySlug {
  return (EXPLORE_PROTOTYPE_CATEGORY_SLUGS as readonly string[]).includes(value);
}

type ExplorePrototypeWorkBase = {
  id: string;
  title: string;
  lead: string;
  creatorName: string;
  creatorInitials: string;
  phase: ExplorePrototypePhase;
  /** null = category fallback */
  thumbnailSrc: string | null;
  thumbnailAlt: string;
  feedbackCount: number;
  followCount: number;
  /** ISO datetime — used for shelf sorting only */
  updatedAt: string;
  publishedAt: string;
  updatedLabel: string;
  /** Pin into 注目作品 shelf */
  featured: boolean;
};

export type ExplorePrototypeGameWork = ExplorePrototypeWorkBase & {
  category: "game";
  genre: string;
  tags: string[];
  estimatedPlayTime?: string;
  platforms: string[];
};

export type ExplorePrototypeAudioWork = ExplorePrototypeWorkBase & {
  category: "audio";
  kind: string;
  genre?: string;
  tags: string[];
  durationLabel: string;
};

export type ExplorePrototypeDevToolWork = ExplorePrototypeWorkBase & {
  category: "dev-tool";
  kind: string;
  tags: string[];
  environments: string[];
  usageMethod: string;
};

export type ExplorePrototypeServiceAppWork = ExplorePrototypeWorkBase & {
  category: "service-app";
  kind: string;
  tags: string[];
  environments: string[];
};

export type ExplorePrototypeWork =
  | ExplorePrototypeGameWork
  | ExplorePrototypeAudioWork
  | ExplorePrototypeDevToolWork
  | ExplorePrototypeServiceAppWork;

const ASSET = "/images/explore-prototype";

export const EXPLORE_PROTOTYPE_WORKS: ExplorePrototypeWork[] = [
  // —— game (6) ——
  {
    id: "ep-game-01",
    category: "game",
    title: "草原ダッシュ",
    lead: "短いコースを駆け抜ける軽快アクション。",
    creatorName: "緑丘ラボ",
    creatorInitials: "緑",
    phase: "正式版公開済み",
    thumbnailSrc: `${ASSET}/game/meadow-runner.svg`,
    thumbnailAlt: "草原を走るキャラクターのゲーム画面",
    feedbackCount: 48,
    followCount: 120,
    updatedAt: "2026-07-18T10:00:00.000Z",
    publishedAt: "2026-03-01T00:00:00.000Z",
    updatedLabel: "3日前に更新",
    featured: true,
    genre: "アクション",
    tags: ["カジュアル", "短時間"],
    estimatedPlayTime: "10分",
    platforms: ["ブラウザ", "PC"],
  },
  {
    id: "ep-game-02",
    category: "game",
    title: "双晶デュエル：記憶の札束をめぐる夜の卓上戦記（長題プロト）",
    lead: "属性カードを組み合わせて相手の陣形を崩す、じっくり読み合う対戦。",
    creatorName: "卓上設計室",
    creatorInitials: "卓",
    phase: "β版",
    thumbnailSrc: `${ASSET}/game/card-duel.svg`,
    thumbnailAlt: "炎と水のカードが向き合うデュエル画面",
    feedbackCount: 22,
    followCount: 55,
    updatedAt: "2026-07-20T08:00:00.000Z",
    publishedAt: "2026-05-12T00:00:00.000Z",
    updatedLabel: "1日前に更新",
    featured: true,
    genre: "カード",
    tags: ["対戦", "戦略", "ターン制"],
    estimatedPlayTime: "30分",
    platforms: ["ブラウザ"],
  },
  {
    id: "ep-game-03",
    category: "game",
    title: "色合わせ盤",
    lead: "マスをスライドして同色を揃えるパズル。",
    creatorName: "断片工房",
    creatorInitials: "断",
    phase: "α版",
    thumbnailSrc: `${ASSET}/game/puzzle-grid.svg`,
    thumbnailAlt: "カラフルなタイルが並ぶパズル盤面",
    feedbackCount: 0,
    followCount: 3,
    updatedAt: "2026-07-10T12:00:00.000Z",
    publishedAt: "2026-07-08T00:00:00.000Z",
    updatedLabel: "11日前に更新",
    featured: false,
    genre: "パズル",
    tags: ["脳トレ"],
    estimatedPlayTime: "5分",
    platforms: ["ブラウザ", "スマホ"],
  },
  {
    id: "ep-game-04",
    category: "game",
    title: "街灯の独白",
    lead: "選択肢で物語が分岐するノベル。夜の街の灯りが語る短い会話を辿る作品です。",
    creatorName: "灯火シナリオ",
    creatorInitials: "灯",
    phase: "試作版",
    thumbnailSrc: `${ASSET}/game/novel-dialog.svg`,
    thumbnailAlt: "会話ウィンドウ付きのノベル画面",
    feedbackCount: 7,
    followCount: 0,
    updatedAt: "2026-07-21T04:00:00.000Z",
    publishedAt: "2026-07-19T00:00:00.000Z",
    updatedLabel: "数時間前に更新",
    featured: false,
    genre: "ノベル",
    tags: ["選択肢", "短編"],
    estimatedPlayTime: "20分",
    platforms: ["ブラウザ"],
  },
  {
    id: "ep-game-05",
    category: "game",
    title: "港町プランナー",
    lead: "道路と施設を配置して港町を育てる。",
    creatorName: "沿岸シミュ",
    creatorInitials: "沿",
    phase: "α版",
    thumbnailSrc: `${ASSET}/game/town-map.svg`,
    thumbnailAlt: "港町のマップと経路が表示された画面",
    feedbackCount: 15,
    followCount: 28,
    updatedAt: "2026-07-15T09:00:00.000Z",
    publishedAt: "2026-06-01T00:00:00.000Z",
    updatedLabel: "6日前に更新",
    featured: true,
    genre: "シミュレーション",
    tags: ["街づくり"],
    estimatedPlayTime: "45分",
    platforms: ["PC", "ブラウザ"],
  },
  {
    id: "ep-game-06",
    category: "game",
    title: "星屑ボード",
    lead: "駒を進めながらマス効果を読むインタラクティブ作品。",
    creatorName: "盤面実験室",
    creatorInitials: "盤",
    phase: "β版",
    thumbnailSrc: null,
    thumbnailAlt: "ゲーム・インタラクティブ作品のサムネイル未設定",
    feedbackCount: 3,
    followCount: 1,
    updatedAt: "2026-07-05T00:00:00.000Z",
    publishedAt: "2026-07-04T00:00:00.000Z",
    updatedLabel: "16日前に更新",
    featured: false,
    genre: "ボード",
    tags: ["ターン制", "実験"],
    estimatedPlayTime: "15分",
    platforms: ["ブラウザ"],
  },

  // —— audio (6) ——
  {
    id: "ep-audio-01",
    category: "audio",
    title: "Neon Pulse",
    lead: "夜のドライブに合うビート。",
    creatorName: "Pulse Studio",
    creatorInitials: "Pu",
    phase: "正式版公開済み",
    thumbnailSrc: `${ASSET}/audio/album-cover.svg`,
    thumbnailAlt: "ピンクと紫の円盤風アルバムジャケット",
    feedbackCount: 36,
    followCount: 90,
    updatedAt: "2026-07-17T10:00:00.000Z",
    publishedAt: "2026-02-10T00:00:00.000Z",
    updatedLabel: "4日前に更新",
    featured: true,
    kind: "楽曲",
    genre: "エレクトロ",
    tags: ["アップテンポ"],
    durationLabel: "3分12秒",
  },
  {
    id: "ep-audio-02",
    category: "audio",
    title: "峠の夕暮れBGM（ループ試作・遠景レイヤー付き長題）",
    lead: "山並みと夕焼けをイメージしたループ向けBGM。シーンの余韻を残す静かな展開です。",
    creatorName: "情景サウンド",
    creatorInitials: "情",
    phase: "α版",
    thumbnailSrc: `${ASSET}/audio/bgm-landscape.svg`,
    thumbnailAlt: "夕暮れの山並みを描いたBGMアートワーク",
    feedbackCount: 11,
    followCount: 24,
    updatedAt: "2026-07-20T14:00:00.000Z",
    publishedAt: "2026-06-20T00:00:00.000Z",
    updatedLabel: "1日前に更新",
    featured: true,
    kind: "BGM",
    tags: ["ループ", "情景"],
    durationLabel: "2分00秒",
  },
  {
    id: "ep-audio-03",
    category: "audio",
    title: "UIクリックセット",
    lead: "ボタンと通知用の短い効果音パック。",
    creatorName: "Click Craft",
    creatorInitials: "Cl",
    phase: "試作版",
    thumbnailSrc: `${ASSET}/audio/sfx-wave.svg`,
    thumbnailAlt: "波形が表示された効果音のビジュアル",
    feedbackCount: 0,
    followCount: 0,
    updatedAt: "2026-07-12T00:00:00.000Z",
    publishedAt: "2026-07-11T00:00:00.000Z",
    updatedLabel: "9日前に更新",
    featured: false,
    kind: "効果音・ジングル",
    tags: ["UI", "パック"],
    durationLabel: "0分08秒",
  },
  {
    id: "ep-audio-04",
    category: "audio",
    title: "案内ボイス試作",
    lead: "アプリ導線向けの短いボイス収録サンプル。",
    creatorName: "Booth Mic",
    creatorInitials: "Bo",
    phase: "β版",
    thumbnailSrc: `${ASSET}/audio/voice-booth.svg`,
    thumbnailAlt: "マイクと収録ブースを示す音声ビジュアル",
    feedbackCount: 5,
    followCount: 8,
    updatedAt: "2026-07-19T06:00:00.000Z",
    publishedAt: "2026-07-01T00:00:00.000Z",
    updatedLabel: "2日前に更新",
    featured: false,
    kind: "ボイス",
    tags: ["案内"],
    durationLabel: "0分25秒",
  },
  {
    id: "ep-audio-05",
    category: "audio",
    title: "夜汽車の対話",
    lead: "二人の乗客が語る短い音声ドラマ。",
    creatorName: "車窓ラジオ",
    creatorInitials: "車",
    phase: "α版",
    thumbnailSrc: `${ASSET}/audio/drama-stage.svg`,
    thumbnailAlt: "舞台幕とタイトルを配した音声ドラマのアート",
    feedbackCount: 19,
    followCount: 41,
    updatedAt: "2026-07-21T01:00:00.000Z",
    publishedAt: "2026-07-18T00:00:00.000Z",
    updatedLabel: "今日更新",
    featured: true,
    kind: "朗読・音声ドラマ",
    genre: "ドラマ",
    tags: ["物語", "短編"],
    durationLabel: "8分40秒",
  },
  {
    id: "ep-audio-06",
    category: "audio",
    title: "雨音レイヤー",
    lead: "作業用の環境音レイヤー。",
    creatorName: "Ambi Lab",
    creatorInitials: "Am",
    phase: "正式版公開済み",
    thumbnailSrc: null,
    thumbnailAlt: "音楽・音声のサムネイル未設定",
    feedbackCount: 2,
    followCount: 6,
    updatedAt: "2026-06-30T00:00:00.000Z",
    publishedAt: "2026-06-28T00:00:00.000Z",
    updatedLabel: "21日前に更新",
    featured: false,
    kind: "BGM",
    tags: ["環境音"],
    durationLabel: "10分00秒",
  },

  // —— dev-tool (6) ——
  {
    id: "ep-tool-01",
    category: "dev-tool",
    title: "JSON→CSV変換",
    lead: "ブラウザ上で表形式へ変換する小さなツール。",
    creatorName: "Format Desk",
    creatorInitials: "Fo",
    phase: "正式版公開済み",
    thumbnailSrc: `${ASSET}/dev-tool/browser-convert.svg`,
    thumbnailAlt: "JSONからCSVへ変換するブラウザツール画面",
    feedbackCount: 41,
    followCount: 77,
    updatedAt: "2026-07-16T10:00:00.000Z",
    publishedAt: "2026-01-15T00:00:00.000Z",
    updatedLabel: "5日前に更新",
    featured: true,
    kind: "ブラウザツール",
    tags: ["変換", "データ"],
    environments: ["Webブラウザ"],
    usageMethod: "ブラウザで利用",
  },
  {
    id: "ep-tool-02",
    category: "dev-tool",
    title: "Forge Lint for VS Code（ルールセット試作・長めの拡張機能名）",
    lead: "保存時に命名と導線の揺れを指摘するエディタ拡張。チーム内ルールのたたき台向けです。",
    creatorName: "Rule Forge",
    creatorInitials: "Ru",
    phase: "β版",
    thumbnailSrc: `${ASSET}/dev-tool/editor-plugin.svg`,
    thumbnailAlt: "エディタサイドバーと拡張パネルの画面",
    feedbackCount: 18,
    followCount: 33,
    updatedAt: "2026-07-20T11:00:00.000Z",
    publishedAt: "2026-05-01T00:00:00.000Z",
    updatedLabel: "1日前に更新",
    featured: true,
    kind: "プラグイン・拡張機能",
    tags: ["lint", "VS Code"],
    environments: ["Visual Studio Code", "macOS"],
    usageMethod: "プラグイン・拡張機能として利用",
  },
  {
    id: "ep-tool-03",
    category: "dev-tool",
    title: "Node Graph Lab",
    lead: "ノードをつないで変換フローを試す。",
    creatorName: "Graph Nest",
    creatorInitials: "Gr",
    phase: "α版",
    thumbnailSrc: `${ASSET}/dev-tool/node-workflow.svg`,
    thumbnailAlt: "入力・変換・出力がつながったノードワークフロー",
    feedbackCount: 0,
    followCount: 4,
    updatedAt: "2026-07-09T00:00:00.000Z",
    publishedAt: "2026-07-07T00:00:00.000Z",
    updatedLabel: "12日前に更新",
    featured: false,
    kind: "生成・変換ツール",
    tags: ["ワークフロー"],
    environments: ["Webブラウザ", "Windows"],
    usageMethod: "ブラウザで利用",
  },
  {
    id: "ep-tool-04",
    category: "dev-tool",
    title: "forge-cli",
    lead: "ビルド監視向けの小さなCLI。",
    creatorName: "Shell Bits",
    creatorInitials: "Sh",
    phase: "試作版",
    thumbnailSrc: `${ASSET}/dev-tool/cli-terminal.svg`,
    thumbnailAlt: "ターミナルで forge build を実行する画面",
    feedbackCount: 9,
    followCount: 0,
    updatedAt: "2026-07-21T02:00:00.000Z",
    publishedAt: "2026-07-15T00:00:00.000Z",
    updatedLabel: "今日更新",
    featured: false,
    kind: "CLI",
    tags: ["ビルド"],
    environments: ["macOS", "Linux"],
    usageMethod: "CLIで利用",
  },
  {
    id: "ep-tool-05",
    category: "dev-tool",
    title: "API Console Lite",
    lead: "エンドポイントを叩いてレスポンスを確認する。",
    creatorName: "Request Pad",
    creatorInitials: "Re",
    phase: "α版",
    thumbnailSrc: `${ASSET}/dev-tool/api-console.svg`,
    thumbnailAlt: "GETリクエストとJSONレスポンスのAPIコンソール",
    feedbackCount: 27,
    followCount: 52,
    updatedAt: "2026-07-18T16:00:00.000Z",
    publishedAt: "2026-04-20T00:00:00.000Z",
    updatedLabel: "3日前に更新",
    featured: true,
    kind: "API",
    tags: ["HTTP", "デバッグ"],
    environments: ["Webブラウザ"],
    usageMethod: "APIとして利用",
  },
  {
    id: "ep-tool-06",
    category: "dev-tool",
    title: "Sprite Pack SDK",
    lead: "アセット変換をコードから呼ぶSDK試作。",
    creatorName: "Pack Orbit",
    creatorInitials: "Pa",
    phase: "β版",
    thumbnailSrc: null,
    thumbnailAlt: "開発ツールのサムネイル未設定",
    feedbackCount: 4,
    followCount: 12,
    updatedAt: "2026-07-02T00:00:00.000Z",
    publishedAt: "2026-06-25T00:00:00.000Z",
    updatedLabel: "19日前に更新",
    featured: false,
    kind: "ライブラリ・SDK",
    tags: ["アセット", "SDK"],
    environments: ["Unity", "Godot"],
    usageMethod: "ライブラリ・SDKとして利用",
  },

  // —— service-app (6) ——
  {
    id: "ep-svc-01",
    category: "service-app",
    title: "Habit Leaf",
    lead: "毎日の小さな習慣をチェックする。",
    creatorName: "Leaf Apps",
    creatorInitials: "Le",
    phase: "正式版公開済み",
    thumbnailSrc: `${ASSET}/service-app/habit-tracker.svg`,
    thumbnailAlt: "習慣チェックリストのアプリ画面",
    feedbackCount: 52,
    followCount: 110,
    updatedAt: "2026-07-17T08:00:00.000Z",
    publishedAt: "2025-11-01T00:00:00.000Z",
    updatedLabel: "4日前に更新",
    featured: true,
    kind: "スマートフォンアプリ",
    tags: ["習慣", "生活"],
    environments: ["iOS", "Android"],
  },
  {
    id: "ep-svc-02",
    category: "service-app",
    title: "暗記デッキ：光合成から歴史年号まで横断する学習カード（長題）",
    lead: "表裏カードで思い出し練習をする学習サービス。分野をまたいだデッキ共有も想定しています。",
    creatorName: "Recall School",
    creatorInitials: "Re",
    phase: "β版",
    thumbnailSrc: `${ASSET}/service-app/study-deck.svg`,
    thumbnailAlt: "学習用フラッシュカードの画面",
    feedbackCount: 21,
    followCount: 45,
    updatedAt: "2026-07-20T09:00:00.000Z",
    publishedAt: "2026-05-20T00:00:00.000Z",
    updatedLabel: "1日前に更新",
    featured: true,
    kind: "Webサービス",
    tags: ["学習", "カード"],
    environments: ["Webブラウザ", "iOS"],
  },
  {
    id: "ep-svc-03",
    category: "service-app",
    title: "付箋ボード",
    lead: "アイデアを色分けして並べる情報整理。",
    creatorName: "Note Nest",
    creatorInitials: "No",
    phase: "α版",
    thumbnailSrc: `${ASSET}/service-app/notes-board.svg`,
    thumbnailAlt: "色付き付箋が並ぶ整理ボード",
    feedbackCount: 0,
    followCount: 2,
    updatedAt: "2026-07-11T00:00:00.000Z",
    publishedAt: "2026-07-10T00:00:00.000Z",
    updatedLabel: "10日前に更新",
    featured: false,
    kind: "Webサービス",
    tags: ["整理"],
    environments: ["Webブラウザ"],
  },
  {
    id: "ep-svc-04",
    category: "service-app",
    title: "家計ライト",
    lead: "カテゴリ別の支出割合をざっくり把握。",
    creatorName: "Coin Home",
    creatorInitials: "Co",
    phase: "試作版",
    thumbnailSrc: `${ASSET}/service-app/budget-home.svg`,
    thumbnailAlt: "家計の円グラフと棒グラフの画面",
    feedbackCount: 8,
    followCount: 0,
    updatedAt: "2026-07-21T03:00:00.000Z",
    publishedAt: "2026-07-16T00:00:00.000Z",
    updatedLabel: "今日更新",
    featured: false,
    kind: "デスクトップアプリ",
    tags: ["家計", "生活"],
    environments: ["Windows", "macOS"],
  },
  {
    id: "ep-svc-05",
    category: "service-app",
    title: "Circle Feed",
    lead: "小さなコミュニティ向けの投稿フィード。",
    creatorName: "Circle Soft",
    creatorInitials: "Ci",
    phase: "α版",
    thumbnailSrc: `${ASSET}/service-app/community-feed.svg`,
    thumbnailAlt: "投稿と共感ボタンのあるコミュニティ画面",
    feedbackCount: 30,
    followCount: 64,
    updatedAt: "2026-07-19T12:00:00.000Z",
    publishedAt: "2026-03-30T00:00:00.000Z",
    updatedLabel: "2日前に更新",
    featured: true,
    kind: "Webサービス",
    tags: ["コミュニティ", "AI"],
    environments: ["Webブラウザ", "Android"],
  },
  {
    id: "ep-svc-06",
    category: "service-app",
    title: "Tab Reminder Bot",
    lead: "リマインドをチャットへ届けるBot試作。",
    creatorName: "Bot Lane",
    creatorInitials: "Bo",
    phase: "β版",
    thumbnailSrc: null,
    thumbnailAlt: "Webサービス・アプリのサムネイル未設定",
    feedbackCount: 6,
    followCount: 9,
    updatedAt: "2026-07-03T00:00:00.000Z",
    publishedAt: "2026-07-01T00:00:00.000Z",
    updatedLabel: "18日前に更新",
    featured: false,
    kind: "Bot",
    tags: ["リマインド"],
    environments: ["Webブラウザ"],
  },
];

export type ExplorePrototypeShelfId = "featured" | "updated" | "newest";

export type ExplorePrototypeShelf = {
  id: ExplorePrototypeShelfId;
  title: string;
  works: ExplorePrototypeWork[];
};

export function getExplorePrototypeWorks(
  category: ExplorePrototypeCategorySlug,
): ExplorePrototypeWork[] {
  return EXPLORE_PROTOTYPE_WORKS.filter((work) => work.category === category);
}

function byUpdatedDesc(a: ExplorePrototypeWork, b: ExplorePrototypeWork) {
  return b.updatedAt.localeCompare(a.updatedAt);
}

function byPublishedDesc(a: ExplorePrototypeWork, b: ExplorePrototypeWork) {
  return b.publishedAt.localeCompare(a.publishedAt);
}

function byEngagementDesc(a: ExplorePrototypeWork, b: ExplorePrototypeWork) {
  const scoreA = a.feedbackCount + a.followCount;
  const scoreB = b.feedbackCount + b.followCount;
  if (scoreB !== scoreA) return scoreB - scoreA;
  return byUpdatedDesc(a, b);
}

export function getExplorePrototypeShelves(
  category: ExplorePrototypeCategorySlug,
): ExplorePrototypeShelf[] {
  const works = getExplorePrototypeWorks(category);
  const featured = works
    .filter((work) => work.featured)
    .sort(byEngagementDesc)
    .slice(0, 4);
  const updated = [...works].sort(byUpdatedDesc).slice(0, 4);
  const newest = [...works].sort(byPublishedDesc).slice(0, 4);

  return [
    { id: "featured", title: "注目作品", works: featured },
    { id: "updated", title: "最近更新", works: updated },
    { id: "newest", title: "新着作品", works: newest },
  ];
}

export function getExplorePrototypeCtaLabel(
  category: ExplorePrototypeCategorySlug,
): string {
  return getExplorePrototypeCategory(category)?.ctaLabel ?? "見る";
}

export function resolveExplorePrototypeThumbnail(
  work: ExplorePrototypeWork,
): { src: string; isFallback: boolean } {
  if (work.thumbnailSrc) {
    return { src: work.thumbnailSrc, isFallback: false };
  }
  const meta = getExplorePrototypeCategory(work.category);
  return {
    src: meta?.fallbackSrc ?? `${ASSET}/fallback/game.svg`,
    isFallback: true,
  };
}

/** Cap chips for card display; returns visible labels + overflow count. */
export function takeChips(
  values: string[],
  limit: number,
): { shown: string[]; overflow: number } {
  const shown = values.slice(0, limit);
  return { shown, overflow: Math.max(0, values.length - shown.length) };
}
