export const witnessingGames = [
  {
    title: "星灯の旅路",
    change: "チュートリアルの導線を改善し、序盤の難易度を調整しました。",
    updatedAt: "2024/05/12",
    image: "/images/landing/game-1.png",
    hasUpdate: true,
  },
  {
    title: "空島パイオニア",
    change: "建築パーツを追加し、クラフト素材のバランスを調整しました。",
    updatedAt: "2024/05/08",
    image: "/images/landing/game-3.png",
    hasUpdate: true,
  },
  {
    title: "炉心の残光",
    change: "ボス戦のバランスを調整し、一部のバグを修正しました。",
    updatedAt: "2024/04/28",
    image: "/images/landing/game-2.png",
    hasUpdate: true,
  },
  {
    title: "喫茶ケットシー",
    change: "現在、更新はありません。次回のアップデートをお待ちください。",
    updatedAt: "2024/04/15",
    image: "/images/landing/game-4.png",
    hasUpdate: false,
  },
] as const;

export const savedGames = [
  {
    title: "森の中の小さな工房",
    developer: "GreenSmith",
    tags: ["シミュレーション", "癒し系"],
    image: "/images/landing/game-5.png",
  },
  {
    title: "星のかけらを探して",
    developer: "Luna Labs",
    tags: ["SF", "探索"],
    image: "/images/landing/game-1.png",
  },
  {
    title: "地下迷宮の冒険者",
    developer: "Studio Aurora",
    tags: ["RPG", "ダンジョン", "ローグライク"],
    image: "/images/landing/game-2.png",
  },
  {
    title: "空賊と風の旅団",
    developer: "Sky Pirate Studio",
    tags: ["アクション", "空戦", "協力プレイ"],
    image: "/images/landing/game-3.png",
  },
  {
    title: "アルカディアの遺跡",
    developer: "Pixel Knights",
    tags: ["アクション", "探索", "ピクセルアート"],
    image: "/images/landing/game-4.png",
  },
] as const;

export const savedSortOptions = [
  { id: "saved-desc", label: "保存日が新しい順" },
  { id: "title-asc", label: "タイトル順" },
] as const;

export type SavedSortId = (typeof savedSortOptions)[number]["id"];

export const savedQuickFilters = [
  { id: "all", label: "すべて", count: 5 },
  { id: "later", label: "あとでプレイ", count: 3 },
  { id: "witnessing", label: "見届け候補", count: 2 },
  { id: "update", label: "更新あり", count: 1 },
] as const;

export const savedSummary = {
  total: 5,
  later: 3,
  witnessing: 2,
  withUpdate: 1,
} as const;

export const witnessingSortOptions = [
  { id: "updated-desc", label: "更新が新しい順" },
  { id: "title-asc", label: "タイトル順" },
] as const;

export type WitnessingSortId = (typeof witnessingSortOptions)[number]["id"];

export const playHistorySortOptions = [
  { id: "played-desc", label: "プレイ日時：新しい順" },
  { id: "played-asc", label: "プレイ日時：古い順" },
  { id: "title-asc", label: "タイトル順" },
] as const;

export type PlayHistorySortId = (typeof playHistorySortOptions)[number]["id"];

export const witnessingQuickFilters = [
  { label: "更新があった作品", count: 4 },
  { label: "まもなく更新されそう", count: 2 },
  { label: "更新がない作品", count: 2 },
  { label: "あなたの声が反映された作品", count: 3 },
] as const;

export const genreFilters = [
  "すべて",
  "アドベンチャー",
  "RPG",
  "サバイバル",
  "シミュレーション",
  "クラフト",
  "探索",
  "経営",
  "ストーリー",
] as const;

export const playHistoryFilterTabs = [
  { id: "all", label: "すべて", count: 30 },
  { id: "witnessing", label: "見届け中", count: 5 },
  { id: "supported", label: "応援中の作者の作品", count: 8 },
  { id: "play-only", label: "プレイのみ", count: 17 },
] as const;

export type PlayHistoryGameTag = {
  label: string;
  variant: "witnessing" | "play-only" | "supported";
};

export type PlayHistoryGame = {
  title: string;
  version: string;
  description: string;
  image: string;
  tags: PlayHistoryGameTag[];
  firstPlay: string;
  playCount: number;
  totalPlayTime: string;
  lastPlay: string;
  hasUpdate: boolean;
  updateVersion?: string;
  memo?: string;
  cleared?: boolean;
  feedbackSent: boolean;
};

export const PLAY_HISTORY_TOTAL = 30;

export const playHistoryGames: PlayHistoryGame[] = [
  {
    title: "星灯の旅路",
    version: "v0.4.0",
    description: "夜の森を旅する短編アドベンチャー",
    image: "/images/landing/game-1.png",
    tags: [
      { label: "見届け中", variant: "witnessing" },
      { label: "応援中の作者", variant: "supported" },
    ],
    firstPlay: "2025/05/18 (v0.1.0)",
    playCount: 4,
    totalPlayTime: "8時間42分",
    lastPlay: "2025/05/18",
    hasUpdate: true,
    updateVersion: "v0.4.0",
    memo: "序盤のチュートリアルが分かりやすくなった。",
    cleared: true,
    feedbackSent: true,
  },
  {
    title: "炉心の残光",
    version: "v0.3.2",
    description: "心の奥に残る、静かな物語",
    image: "/images/landing/game-2.png",
    tags: [{ label: "見届け中", variant: "witnessing" }],
    firstPlay: "2025/05/10 (v0.2.0)",
    playCount: 2,
    totalPlayTime: "3時間15分",
    lastPlay: "2025/05/14",
    hasUpdate: false,
    feedbackSent: true,
  },
  {
    title: "空島パイオニア",
    version: "v0.2.1",
    description: "空に浮かぶ島々をめぐるクラフトサバイバル",
    image: "/images/landing/game-3.png",
    tags: [{ label: "プレイのみ", variant: "play-only" }],
    firstPlay: "2025/05/05 (v0.2.1)",
    playCount: 1,
    totalPlayTime: "1時間20分",
    lastPlay: "2025/05/05",
    hasUpdate: false,
    feedbackSent: false,
  },
  {
    title: "森の中の小さな工房",
    version: "v0.1.5",
    description: "森の奥で始まる、小さな工房経営シミュレーション",
    image: "/images/landing/game-5.png",
    tags: [{ label: "応援中の作者", variant: "supported" }],
    firstPlay: "2025/04/28 (v0.1.0)",
    playCount: 3,
    totalPlayTime: "5時間08分",
    lastPlay: "2025/05/02",
    hasUpdate: true,
    updateVersion: "v0.1.5",
    feedbackSent: false,
  },
  {
    title: "浮遊ノート",
    version: "v0.3.0",
    description: "空に浮かぶ島々をめぐる、記録型アドベンチャー",
    image: "/images/landing/game-3.png",
    tags: [{ label: "プレイのみ", variant: "play-only" }],
    firstPlay: "2025/05/16 (v0.3.0)",
    playCount: 1,
    totalPlayTime: "45分",
    lastPlay: "2025/05/16",
    hasUpdate: false,
    feedbackSent: false,
  },
  {
    title: "夏の向こう側",
    version: "v0.2.4",
    description: "あの夏の記憶を、もう一度辿るノスタルジアRPG",
    image: "/images/landing/game-4.png",
    tags: [
      { label: "見届け中", variant: "witnessing" },
      { label: "応援中の作者", variant: "supported" },
    ],
    firstPlay: "2025/04/20 (v0.1.2)",
    playCount: 5,
    totalPlayTime: "12時間30分",
    lastPlay: "2025/05/17",
    hasUpdate: true,
    updateVersion: "v0.2.4",
    memo: "エンディング前のイベントが追加された。",
    cleared: true,
    feedbackSent: true,
  },
  {
    title: "深淵ノート",
    version: "v0.5.1",
    description: "失われた記憶を辿る、ダンジョン探索RPG",
    image: "/images/landing/game-5.png",
    tags: [{ label: "プレイのみ", variant: "play-only" }],
    firstPlay: "2025/03/08 (v0.4.0)",
    playCount: 7,
    totalPlayTime: "18時間05分",
    lastPlay: "2025/05/12",
    hasUpdate: false,
    memo: "ボス戦がかなり難しい。",
    feedbackSent: true,
  },
  {
    title: "喫茶ケットシー",
    version: "v0.1.0",
    description: "猫とコーヒーと、ゆったり営業する癒し系シミュレーション",
    image: "/images/landing/game-4.png",
    tags: [{ label: "見届け中", variant: "witnessing" }],
    firstPlay: "2025/05/01 (v0.1.0)",
    playCount: 2,
    totalPlayTime: "2時間10分",
    lastPlay: "2025/05/11",
    hasUpdate: false,
    feedbackSent: false,
  },
  {
    title: "星のかけらを探して",
    version: "v0.2.0",
    description: "小さな星の欠片を集める、SF探索アドベンチャー",
    image: "/images/landing/game-1.png",
    tags: [{ label: "応援中の作者", variant: "supported" }],
    firstPlay: "2025/04/15 (v0.1.5)",
    playCount: 2,
    totalPlayTime: "3時間40分",
    lastPlay: "2025/05/09",
    hasUpdate: true,
    updateVersion: "v0.2.0",
    feedbackSent: true,
  },
  {
    title: "地下迷宮の冒険者",
    version: "v0.3.3",
    description: "毎回変わる迷宮を攻略するローグライトRPG",
    image: "/images/landing/game-2.png",
    tags: [{ label: "プレイのみ", variant: "play-only" }],
    firstPlay: "2025/05/15 (v0.3.3)",
    playCount: 1,
    totalPlayTime: "1時間05分",
    lastPlay: "2025/05/15",
    hasUpdate: false,
    feedbackSent: false,
  },
];

export const playHistorySummary = [
  { label: "見届け中作品", value: "5" },
  { label: "応援中作者", value: "12" },
  { label: "プレイ作品合計", value: "30" },
  { label: "合計プレイ時間", value: "41時間56分" },
  { label: "最多プレイ日", value: "2025/05/18" },
] as const;

export const playHistorySidebarFilters = [
  "見届け中 / プレイのみ",
  "応援中作者の作品",
  "プレイ期間",
] as const;

export const supportedCreators = [
  { name: "GreenSmith", initial: "G" },
  { name: "Luna Labs", initial: "L" },
  { name: "Studio Aurora", initial: "S" },
  { name: "Pixel Knights", initial: "P" },
  { name: "Sky Pirate", initial: "S" },
] as const;

// --- FB履歴 ---

export const FEEDBACK_HISTORY_TOTAL = 28;

export const feedbackFilterTabs = [
  { id: "all", label: "すべて", count: 28 },
  { id: "free", label: "自由記述", count: 12 },
  { id: "choice", label: "選択式", count: 16 },
] as const;

export const feedbackSortOptions = [
  { id: "newest", label: "新しい順" },
  { id: "oldest", label: "古い順" },
  { id: "game-asc", label: "作品名順" },
] as const;

export type FeedbackSortId = (typeof feedbackSortOptions)[number]["id"];

export type FeedbackEntry = {
  id: string;
  game: string;
  version: string;
  image: string;
  timestamp: string;
  type: "free" | "choice";
  content?: string;
  choices?: { question: string; answer: string }[];
  empathyCount?: number;
  reflected?: { version: string; note: string };
};

export const feedbackEntries: FeedbackEntry[] = [
  {
    id: "fb-1",
    game: "星灯の旅路",
    version: "v0.4.0",
    image: "/images/landing/game-1.png",
    timestamp: "2025/05/18 22:34",
    type: "free",
    content:
      "マップのワープポイントが分かりにくかったです。序盤で一度迷子になりました。標識かミニマップの強調があると助かります。",
    empathyCount: 8,
    reflected: {
      version: "v0.4.0",
      note: "チュートリアルにワープの説明を追加しました。",
    },
  },
  {
    id: "fb-2",
    game: "星灯の旅路",
    version: "v0.3.1",
    image: "/images/landing/game-1.png",
    timestamp: "2025/05/10 19:12",
    type: "choice",
    choices: [
      { question: "もう一度遊びたい？", answer: "遊びたい" },
      { question: "難易度は？", answer: "やや難しい" },
    ],
  },
  {
    id: "fb-3",
    game: "炉心の残光",
    version: "v0.3.2",
    image: "/images/landing/game-2.png",
    timestamp: "2025/05/14 21:05",
    type: "free",
    content:
      "ストーリーのテンポが良く、最後まで一気に読めました。BGMとの相性も素晴らしいです。",
    empathyCount: 12,
    reflected: {
      version: "v0.3.2",
      note: "エンディングシーンの演出を調整しました。",
    },
  },
  {
    id: "fb-4",
    game: "夏の向こう側",
    version: "v0.2.4",
    image: "/images/landing/game-4.png",
    timestamp: "2025/05/17 18:40",
    type: "choice",
    choices: [
      { question: "印象に残った場面は？", answer: "夕暮れの浜辺" },
      { question: "もう一度遊びたい？", answer: "ぜひ遊びたい" },
    ],
    empathyCount: 5,
  },
  {
    id: "fb-5",
    game: "空島パイオニア",
    version: "v0.2.1",
    image: "/images/landing/game-3.png",
    timestamp: "2025/05/05 14:22",
    type: "free",
    content: "クラフトのレシピ一覧が見づらい。カテゴリ分けがあると探しやすそう。",
    empathyCount: 3,
  },
  {
    id: "fb-6",
    game: "深淵ノート",
    version: "v0.5.0",
    image: "/images/landing/game-5.png",
    timestamp: "2025/05/12 23:18",
    type: "choice",
    choices: [
      { question: "ボス戦の難易度は？", answer: "かなり難しい" },
      { question: "再挑戦したい？", answer: "したい" },
    ],
  },
  {
    id: "fb-7",
    game: "森の中の小さな工房",
    version: "v0.1.5",
    image: "/images/landing/game-5.png",
    timestamp: "2025/05/02 16:55",
    type: "free",
    content: "作業の手触りが気持ちいい。もう少し家具のバリエーションがあると嬉しい。",
    empathyCount: 6,
    reflected: {
      version: "v0.1.5",
      note: "新しい家具パーツを3種追加しました。",
    },
  },
  {
    id: "fb-8",
    game: "喫茶ケットシー",
    version: "v0.1.0",
    image: "/images/landing/game-4.png",
    timestamp: "2025/05/11 12:30",
    type: "free",
    content: "癒し系として最高。猫の動きがかわいくてずっと見ていられる。",
    empathyCount: 15,
  },
];

export const feedbackSidebarFilters = [
  "作品",
  "バージョン",
  "フィードバックの種類",
  "ステータス",
  "期間",
] as const;

export const feedbackStats = [
  { label: "送信したフィードバック", value: "28件" },
  { label: "もらった共感", value: "56人" },
  { label: "改善に反映された", value: "5件" },
  { label: "返信・反応があった", value: "3件" },
] as const;

// --- 実績 ---

export const achievementProgress = { earned: 12, total: 48, percent: 25 };

export const achievementCategories = [
  "すべて",
  "見届ける",
  "声を届ける",
  "つながる",
  "その他",
] as const;

export const achievementSortOptions = [
  { id: "progress", label: "進行状況順" },
  { id: "earned-desc", label: "獲得日が新しい順" },
  { id: "title-asc", label: "タイトル順" },
] as const;

export type AchievementSortId = (typeof achievementSortOptions)[number]["id"];

export type AchievementItem = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  earned: boolean;
  earnedDate?: string;
  progress?: { current: number; target: number; unit: string };
  category: string;
};

export const recentAchievements: AchievementItem[] = [
  {
    id: "a1",
    title: "初めての声",
    description: "初めてフィードバックを送信した",
    emoji: "🌱",
    earned: true,
    earnedDate: "2025/05/18",
    category: "声を届ける",
  },
  {
    id: "a2",
    title: "共感の輪",
    description: "フィードバックに10いいねをもらった",
    emoji: "💜",
    earned: true,
    earnedDate: "2025/05/16",
    category: "つながる",
  },
  {
    id: "a3",
    title: "見届け人",
    description: "初めて作品を見届けた",
    emoji: "👁",
    earned: true,
    earnedDate: "2025/05/14",
    category: "見届ける",
  },
  {
    id: "a4",
    title: "変化の証人",
    description: "同じ作品を5回以上プレイした",
    emoji: "✨",
    earned: true,
    earnedDate: "2025/05/12",
    category: "見届ける",
  },
  {
    id: "a5",
    title: "応援の始まり",
    description: "初めて開発者をフォローした",
    emoji: "📣",
    earned: true,
    earnedDate: "2025/05/08",
    category: "つながる",
  },
];

export const allAchievements: AchievementItem[] = [
  ...recentAchievements,
  {
    id: "a6",
    title: "初版見届け人",
    description: "v0.1から作品を見届けた",
    emoji: "🏁",
    earned: true,
    earnedDate: "2025/05/10",
    category: "見届ける",
  },
  {
    id: "a7",
    title: "育てた人",
    description: "フィードバックが改善に反映された",
    emoji: "🌿",
    earned: true,
    earnedDate: "2025/05/06",
    category: "声を届ける",
  },
  {
    id: "a8",
    title: "応援団",
    description: "3人以上の開発者をフォローした",
    emoji: "🎺",
    earned: true,
    earnedDate: "2025/05/04",
    category: "つながる",
  },
  {
    id: "a9",
    title: "長期の伴走者",
    description: "同じ作品を3ヶ月見届けた",
    emoji: "🗓",
    earned: false,
    progress: { current: 2, target: 3, unit: "ヶ月" },
    category: "見届ける",
  },
  {
    id: "a10",
    title: "信頼の声",
    description: "「参考になった」を5回もらった",
    emoji: "🤝",
    earned: false,
    progress: { current: 2, target: 5, unit: "回" },
    category: "声を届ける",
  },
  {
    id: "a11",
    title: "コミュニティの架け橋",
    description: "他の人のFBに20いいねした",
    emoji: "🌉",
    earned: false,
    progress: { current: 7, target: 20, unit: "" },
    category: "つながる",
  },
  {
    id: "a12",
    title: "レジェンド見届け人",
    description: "10作品以上を見届けた",
    emoji: "👑",
    earned: false,
    progress: { current: 3, target: 10, unit: "作品" },
    category: "見届ける",
  },
];

// --- フォロー中開発者 ---

export const FOLLOWING_TOTAL = 23;

export const followingFilterTabs = [
  { id: "all", label: "すべて", count: 23 },
  { id: "developing", label: "開発中", count: 18 },
  { id: "released", label: "完成品あり", count: 5 },
] as const;

export const followingSortOptions = [
  { id: "followed-desc", label: "フォローした順" },
  { id: "name-asc", label: "名前順" },
  { id: "followers-desc", label: "フォロワー数順" },
] as const;

export type FollowingSortId = (typeof followingSortOptions)[number]["id"];

export type FollowingDeveloper = {
  id: string;
  name: string;
  initial: string;
  badge?: string;
  bio: string;
  followers: number;
  watching: number;
  game: {
    title: string;
    image: string;
    status: "developing" | "released";
    tags: string[];
  };
};

export const followingDevelopers: FollowingDeveloper[] = [
  {
    id: "dev-1",
    name: "Sora Games",
    initial: "S",
    badge: "新進開発者",
    bio: "短編アドベンチャーと、静かな物語を作っています。",
    followers: 842,
    watching: 128,
    game: {
      title: "星灯の旅路",
      image: "/images/landing/game-1.png",
      status: "developing",
      tags: ["アドベンチャー", "ストーリー"],
    },
  },
  {
    id: "dev-2",
    name: "LunaWorks",
    initial: "L",
    bio: "SF探索と、星をテーマにした作品を開発中。",
    followers: 1205,
    watching: 256,
    game: {
      title: "星のかけらを探して",
      image: "/images/landing/game-1.png",
      status: "developing",
      tags: ["SF", "探索"],
    },
  },
  {
    id: "dev-3",
    name: "Pixel Jam",
    initial: "P",
    bio: "ピクセルアートで作る、レトロ風アクション。",
    followers: 2340,
    watching: 512,
    game: {
      title: "アルカディアの遺跡",
      image: "/images/landing/game-4.png",
      status: "released",
      tags: ["アクション", "ピクセルアート"],
    },
  },
  {
    id: "dev-4",
    name: "GreenSmith",
    initial: "G",
    bio: "癒し系シミュレーションと、工房経営ゲーム。",
    followers: 567,
    watching: 89,
    game: {
      title: "森の中の小さな工房",
      image: "/images/landing/game-5.png",
      status: "developing",
      tags: ["シミュレーション", "癒し系"],
    },
  },
  {
    id: "dev-5",
    name: "Studio Aurora",
    initial: "A",
    bio: "ダンジョン探索RPGと、ローグライト作品。",
    followers: 1890,
    watching: 340,
    game: {
      title: "地下迷宮の冒険者",
      image: "/images/landing/game-2.png",
      status: "developing",
      tags: ["RPG", "ローグライク"],
    },
  },
  {
    id: "dev-6",
    name: "Sky Pirate Studio",
    initial: "K",
    bio: "空を舞台にしたアクションと、協力プレイ。",
    followers: 723,
    watching: 156,
    game: {
      title: "空賊と風の旅団",
      image: "/images/landing/game-3.png",
      status: "developing",
      tags: ["アクション", "協力プレイ"],
    },
  },
];

export const recentFollowing = [
  { name: "Sora Games", initial: "S", date: "2025/05/18" },
  { name: "LunaWorks", initial: "L", date: "2025/05/15" },
  { name: "Pixel Jam", initial: "P", date: "2025/05/10" },
] as const;

export const followingAboutPoints = [
  "新作・更新をいち早くキャッチ",
  "フィードバックで開発を応援",
  "作品の成長を一緒に見届ける",
] as const;
