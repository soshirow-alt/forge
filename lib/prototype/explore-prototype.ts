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
    href: "/home?category=game",
    fallbackSrc: "/images/explore-prototype/fallback/game.svg",
  },
  {
    slug: "audio",
    label: "音楽・音声",
    description: "楽曲・BGM・効果音・ボイス",
    ctaLabel: "聴く",
    href: "/home?category=audio",
    fallbackSrc: "/images/explore-prototype/fallback/audio.svg",
  },
  {
    slug: "dev-tool",
    label: "開発ツール",
    description: "制作や開発を助けるツール",
    ctaLabel: "利用する",
    href: "/home?category=dev-tool",
    fallbackSrc: "/images/explore-prototype/fallback/dev-tool.svg",
  },
  {
    slug: "service-app",
    label: "Webサービス・アプリ",
    description: "Webサービスや各種アプリ",
    ctaLabel: "利用する",
    href: "/home?category=service-app",
    fallbackSrc: "/images/explore-prototype/fallback/service-app.svg",
  },
];

/** Canonical list URLs for the future discovery home (Preview /home). */
export function buildFutureHomeHref(options?: {
  category?: ExplorePrototypeCategorySlug | null;
}): string {
  if (options?.category) {
    return `/home?category=${options.category}`;
  }
  return "/home";
}

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

export type ExplorePrototypeLatestUpdate = {
  versionLabel: string;
  dateLabel: string;
  title: string;
  changes: string[];
};

export type ExplorePrototypeFeedbackSample = {
  displayName: string;
  comment: string;
  relativeDate: string;
  empathyCount: number;
};

type ExplorePrototypeWorkBase = {
  id: string;
  slug: string;
  title: string;
  lead: string;
  shortDescription: string;
  description: string;
  highlights: string[];
  tryFocus: string[];
  latestUpdate: ExplorePrototypeLatestUpdate;
  feedbackSamples: ExplorePrototypeFeedbackSample[];
  creatorName: string;
  creatorInitials: string;
  phase: ExplorePrototypePhase;
  /** null = category fallback */
  thumbnailSrc: string | null;
  thumbnailAlt: string;
  feedbackCount: number;
  followCount: number;
  /** Primary usage (players / listeners / users) for discovery stats */
  primaryUsageCount: number;
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
  controlsOrConditions?: string;
};

export type ExplorePrototypeAudioWork = ExplorePrototypeWorkBase & {
  category: "audio";
  kind: string;
  genre?: string;
  tags: string[];
  durationLabel: string;
  listeningContext?: string;
};

export type ExplorePrototypeDevToolWork = ExplorePrototypeWorkBase & {
  category: "dev-tool";
  kind: string;
  tags: string[];
  environments: string[];
  usageMethod: string;
  targetUsers?: string;
  prerequisites?: string;
};

export type ExplorePrototypeServiceAppWork = ExplorePrototypeWorkBase & {
  category: "service-app";
  kind: string;
  tags: string[];
  environments: string[];
  intendedUsers?: string;
  problemSolved?: string;
  usageScenes?: string[];
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
    slug: "meadow-dash",
    category: "game",
    title: "草原ダッシュ",
    lead: "短いコースを駆け抜ける軽快アクション。",
    shortDescription: "短いコースを駆け抜ける軽快アクション。",
    description:
      "草原を走るキャラクターを操作し、障害物を避けながらゴールを目指します。短時間で遊べるカジュアルなアクションで、リトライしやすい設計です。正式版ではコース数が増え、速度調整やスコア表示も整えられています。",
    highlights: [
      "10分前後で遊べる短尺コース",
      "キーボード／タッチの両対応",
      "スコアとベスト記録をすぐ確認",
    ],
    tryFocus: ["ジャンプと加速のタイミング", "後半コースの障害物パターン"],
    latestUpdate: {
      versionLabel: "ver 1.3",
      dateLabel: "3日前",
      title: "夕方コースの難易度調整",
      changes: [
        "後半の障害物間隔を見直し",
        "初回クリア時のフィードバック導線を追加",
      ],
    },
    feedbackSamples: [
      {
        displayName: "そよ風プレイヤー",
        comment: "短いのに手応えがあって、もう一回やりたくなる。ジャンプのタイミングが気持ちいい。",
        relativeDate: "5日前",
        empathyCount: 12,
      },
      {
        displayName: "草原ウォーカー",
        comment: "スマホでも操作しやすくて通勤前に1本遊べる。難易度はちょうどいい。",
        relativeDate: "1週間前",
        empathyCount: 8,
      },
      {
        displayName: "ラン記録係",
        comment: "ベスト更新の表示が分かりやすい。次のバージョンでコース追加が楽しみ。",
        relativeDate: "2週間前",
        empathyCount: 5,
      },
    ],
    creatorName: "緑丘ラボ",
    creatorInitials: "緑",
    phase: "正式版公開済み",
    thumbnailSrc: `${ASSET}/game/meadow-runner.svg`,
    thumbnailAlt: "草原を走るキャラクターのゲーム画面",
    feedbackCount: 48,
    followCount: 120,
    primaryUsageCount: 285,
    updatedAt: "2026-07-18T10:00:00.000Z",
    publishedAt: "2026-03-01T00:00:00.000Z",
    updatedLabel: "3日前に更新",
    featured: true,
    genre: "アクション",
    tags: ["カジュアル", "短時間"],
    estimatedPlayTime: "10分",
    platforms: ["ブラウザ", "PC"],
    controlsOrConditions: "方向キーまたはWASDで移動、スペースでジャンプ",
  },
  {
    id: "ep-game-02",
    slug: "twin-crystal-duel",
    category: "game",
    title: "双晶デュエル：記憶の札束をめぐる夜の卓上戦記（長題プロト）",
    lead: "属性カードを組み合わせて相手の陣形を崩す、じっくり読み合う対戦。",
    shortDescription:
      "属性カードを組み合わせて相手の陣形を崩す、じっくり読み合う対戦。",
    description:
      "炎と水など属性の札を組み合わせ、相手の陣形を崩すターン制対戦です。1手先ではなく数手先の配置を読み合う設計で、夜の卓上を舞台にした世界観が続きます。β版ではカード効果の説明表示と観戦モードが試験導入されています。",
    highlights: [
      "属性の組み合わせで陣形が変わる",
      "ターンごとに読み合いが深まる",
      "長いタイトルでも一覧で折り返し表示",
    ],
    tryFocus: [
      "初手の札配置と属性の相性",
      "相手の陣形を崩すタイミング",
    ],
    latestUpdate: {
      versionLabel: "β 0.8",
      dateLabel: "1日前",
      title: "カード効果の説明UIを改善",
      changes: [
        "長文効果をホバーで段階表示",
        "観戦モードの手番表示を調整",
      ],
    },
    feedbackSamples: [
      {
        displayName: "卓上読み手",
        comment: "効果の説明が見やすくなって、初見でも戦略を組み立てやすい。",
        relativeDate: "2日前",
        empathyCount: 6,
      },
      {
        displayName: "夜の対戦者",
        comment: "読み合いが深くて30分あっという間。観戦モードも面白い。",
        relativeDate: "4日前",
        empathyCount: 4,
      },
    ],
    creatorName: "卓上設計室",
    creatorInitials: "卓",
    phase: "β版",
    thumbnailSrc: `${ASSET}/game/card-duel.svg`,
    thumbnailAlt: "炎と水のカードが向き合うデュエル画面",
    feedbackCount: 22,
    followCount: 55,
    primaryUsageCount: 133,
    updatedAt: "2026-07-20T08:00:00.000Z",
    publishedAt: "2026-05-12T00:00:00.000Z",
    updatedLabel: "1日前に更新",
    featured: true,
    genre: "カード",
    tags: ["対戦", "戦略", "ターン制"],
    estimatedPlayTime: "30分",
    platforms: ["ブラウザ"],
    controlsOrConditions: "マウスまたはタップでカード選択、ドラッグで配置",
  },
  {
    id: "ep-game-03",
    slug: "color-match-board",
    category: "game",
    title: "色合わせ盤",
    lead: "マスをスライドして同色を揃えるパズル。",
    shortDescription: "マスをスライドして同色を揃えるパズル。",
    description:
      "カラフルなタイルをスライドし、同色を揃えて消していくパズルです。少ない手数で揃えるほど高得点になる設計で、短時間の脳トレ向けです。α版では盤面サイズの切り替えと操作ガイドが試験中です。",
    highlights: [
      "5分前後で1ステージクリア",
      "スマホのスワイプ操作に対応",
      "手数制限でスコアを競える",
    ],
    tryFocus: ["スライド方向の先読み", "少ない手数で揃えるコツ"],
    latestUpdate: {
      versionLabel: "α 0.4",
      dateLabel: "11日前",
      title: "盤面サイズの切り替えを追加",
      changes: [
        "4×4と5×5の切り替えを試験導入",
        "初回プレイ時の操作ガイドを追加",
      ],
    },
    feedbackSamples: [],
    creatorName: "断片工房",
    creatorInitials: "断",
    phase: "α版",
    thumbnailSrc: `${ASSET}/game/puzzle-grid.svg`,
    thumbnailAlt: "カラフルなタイルが並ぶパズル盤面",
    feedbackCount: 0,
    followCount: 3,
    primaryUsageCount: 12,
    updatedAt: "2026-07-10T12:00:00.000Z",
    publishedAt: "2026-07-08T00:00:00.000Z",
    updatedLabel: "11日前に更新",
    featured: false,
    genre: "パズル",
    tags: ["脳トレ"],
    estimatedPlayTime: "5分",
    platforms: ["ブラウザ", "スマホ"],
    controlsOrConditions: "スワイプまたは矢印キーでタイルをスライド",
  },
  {
    id: "ep-game-04",
    slug: "streetlamp-monologue",
    category: "game",
    title: "街灯の独白",
    lead: "選択肢で物語が分岐するノベル。夜の街の灯りが語る短い会話を辿る作品です。",
    shortDescription: "夜の街灯が語る、選択肢で分岐する短編ノベル。",
    description:
      "夜の街を照らす街灯の視点から、通りすがる人々との短い会話を辿るノベルです。選択肢によって会話の温度や結末が変わり、20分ほどで一話完結します。試作版では分岐マップの表示とセーブ位置の見直しが進行中です。",
    highlights: [
      "街灯視点の静かな語り口",
      "選択肢ごとに会話の温度が変化",
      "1話20分で完結する短編構成",
    ],
    tryFocus: ["最初の選択肢が後半に与える影響", "会話ログの折り返し表示"],
    latestUpdate: {
      versionLabel: "試作 0.2",
      dateLabel: "数時間前",
      title: "分岐マップの表示を調整",
      changes: [
        "会話ログの長文折り返しを改善",
        "セーブ位置の再開導線を追加",
      ],
    },
    feedbackSamples: [
      {
        displayName: "夜更かし読者",
        comment: "街灯の独白が静かで好き。選択肢の結果が自然に感じられる。",
        relativeDate: "1日前",
        empathyCount: 3,
      },
      {
        displayName: "分岐探索派",
        comment: "分岐マップがあると全体像が掴みやすい。もう少し分岐が欲しい。",
        relativeDate: "3日前",
        empathyCount: 2,
      },
    ],
    creatorName: "灯火シナリオ",
    creatorInitials: "灯",
    phase: "試作版",
    thumbnailSrc: `${ASSET}/game/novel-dialog.svg`,
    thumbnailAlt: "会話ウィンドウ付きのノベル画面",
    feedbackCount: 7,
    followCount: 0,
    primaryUsageCount: 5,
    updatedAt: "2026-07-21T04:00:00.000Z",
    publishedAt: "2026-07-19T00:00:00.000Z",
    updatedLabel: "数時間前に更新",
    featured: false,
    genre: "ノベル",
    tags: ["選択肢", "短編"],
    estimatedPlayTime: "20分",
    platforms: ["ブラウザ"],
    controlsOrConditions: "クリックまたはタップで選択肢を進行",
  },
  {
    id: "ep-game-05",
    slug: "harbor-planner",
    category: "game",
    title: "港町プランナー",
    lead: "道路と施設を配置して港町を育てる。",
    shortDescription: "道路と施設を配置して港町を育てるシミュレーション。",
    description:
      "港町のマップ上に道路や倉庫、市場を配置し、交易路を整えて町を発展させるシミュレーションです。施設の配置が物流と収益に直結し、45分ほどかけて町の姿を変えていけます。α版では新しい沿岸エリアと港の拡張条件が追加されています。",
    highlights: [
      "配置が物流ルートに直結",
      "港の拡張で町の見た目が変化",
      "PCとブラウザの両方で操作可能",
    ],
    tryFocus: [
      "初期の道路と倉庫の配置バランス",
      "港拡張のタイミングと資源管理",
    ],
    latestUpdate: {
      versionLabel: "α 0.6",
      dateLabel: "6日前",
      title: "沿岸エリアと港拡張を追加",
      changes: [
        "新エリアの施設配置ルールを調整",
        "港拡張時の資源コストを見直し",
      ],
    },
    feedbackSamples: [
      {
        displayName: "町づくり好き",
        comment: "物流の見える化が分かりやすい。港が大きくなると達成感がある。",
        relativeDate: "3日前",
        empathyCount: 5,
      },
      {
        displayName: "沿岸観光客",
        comment: "初期配置の失敗がリカバリーしづらいので、チュートリアルを厚くしてほしい。",
        relativeDate: "5日前",
        empathyCount: 3,
      },
    ],
    creatorName: "沿岸シミュ",
    creatorInitials: "沿",
    phase: "α版",
    thumbnailSrc: `${ASSET}/game/town-map.svg`,
    thumbnailAlt: "港町のマップと経路が表示された画面",
    feedbackCount: 15,
    followCount: 28,
    primaryUsageCount: 70,
    updatedAt: "2026-07-15T09:00:00.000Z",
    publishedAt: "2026-06-01T00:00:00.000Z",
    updatedLabel: "6日前に更新",
    featured: true,
    genre: "シミュレーション",
    tags: ["街づくり"],
    estimatedPlayTime: "45分",
    platforms: ["PC", "ブラウザ"],
    controlsOrConditions: "マウスで施設をドラッグ配置、ホイールでマップ拡大縮小",
  },
  {
    id: "ep-game-06",
    slug: "stardust-board",
    category: "game",
    title: "星屑ボード",
    lead: "駒を進めながらマス効果を読むインタラクティブ作品。",
    shortDescription: "駒を進めながらマス効果を読むボードゲーム風の試作。",
    description:
      "星屑のマス目を進みながら、マスごとの効果を読み合うインタラクティブ作品です。ターン制で駒の移動と効果発動を組み合わせ、15分ほどの短い対局を想定しています。β版ではマス効果のプレビュー表示とターン終了の確認ダイアログが試験中です。",
    highlights: [
      "マス効果を先読みする読み合い",
      "短い対局で完結するターン制",
      "実験的なルールセットを試せる",
    ],
    tryFocus: [
      "マス効果のプレビュー表示",
      "ターン終了前の駒位置の確認",
    ],
    latestUpdate: {
      versionLabel: "β 0.3",
      dateLabel: "16日前",
      title: "マス効果プレビューを追加",
      changes: [
        "ホバーで効果テキストを表示",
        "ターン終了時の確認ダイアログを追加",
      ],
    },
    feedbackSamples: [
      {
        displayName: "盤面実験参加者",
        comment: "効果プレビューがあると初見でも戦略を立てやすい。ルールが面白い。",
        relativeDate: "2週間前",
        empathyCount: 2,
      },
    ],
    creatorName: "盤面実験室",
    creatorInitials: "盤",
    phase: "β版",
    thumbnailSrc: null,
    thumbnailAlt: "ゲーム・インタラクティブ作品のサムネイル未設定",
    feedbackCount: 3,
    followCount: 1,
    primaryUsageCount: 7,
    updatedAt: "2026-07-05T00:00:00.000Z",
    publishedAt: "2026-07-04T00:00:00.000Z",
    updatedLabel: "16日前に更新",
    featured: false,
    genre: "ボード",
    tags: ["ターン制", "実験"],
    estimatedPlayTime: "15分",
    platforms: ["ブラウザ"],
    controlsOrConditions: "クリックで駒を選択し、ハイライトされたマスをクリックして移動",
  },

  // —— audio (6) ——
  {
    id: "ep-audio-01",
    slug: "neon-pulse",
    category: "audio",
    title: "Neon Pulse",
    lead: "夜のドライブに合うビート。",
    shortDescription: "夜のドライブに合うアップテンポのエレクトロビート。",
    description:
      "ネオン街を走るイメージのアップテンポなエレクトロ楽曲です。3分12秒の構成で、サビ前のビルドアップとドロップのコントラストが特徴です。正式版ではミックスの低域を整理し、車載スピーカーでも聴きやすいバランスに調整されています。",
    highlights: [
      "3分12秒のコンパクトな構成",
      "ビルドアップからドロップへの起伏",
      "ループせず通しで聴ける設計",
    ],
    tryFocus: ["サビ前のビルドアップ", "低域のバランスと車載再生"],
    latestUpdate: {
      versionLabel: "ver 2.0",
      dateLabel: "4日前",
      title: "低域ミックスの再調整",
      changes: [
        "キックとベースの分離を改善",
        "車載スピーカー向けの上限レベルを調整",
      ],
    },
    feedbackSamples: [
      {
        displayName: "夜ドライブ派",
        comment: "低域が締まって車内でも聴きやすくなった。ビートが気持ちいい。",
        relativeDate: "3日前",
        empathyCount: 9,
      },
      {
        displayName: "Pulseファン",
        comment: "ドロップの入り方が好き。もう少し長いバージョンも欲しい。",
        relativeDate: "1週間前",
        empathyCount: 6,
      },
      {
        displayName: "エレクトロ聴き手",
        comment: "3分で完結するのがちょうどいい。プレイリストに入れやすい。",
        relativeDate: "2週間前",
        empathyCount: 4,
      },
    ],
    creatorName: "Pulse Studio",
    creatorInitials: "Pu",
    phase: "正式版公開済み",
    thumbnailSrc: `${ASSET}/audio/album-cover.svg`,
    thumbnailAlt: "ピンクと紫の円盤風アルバムジャケット",
    feedbackCount: 36,
    followCount: 90,
    primaryUsageCount: 215,
    updatedAt: "2026-07-17T10:00:00.000Z",
    publishedAt: "2026-02-10T00:00:00.000Z",
    updatedLabel: "4日前に更新",
    featured: true,
    kind: "楽曲",
    genre: "エレクトロ",
    tags: ["アップテンポ"],
    durationLabel: "3分12秒",
    listeningContext: "夜のドライブや作業中のBGMとして",
  },
  {
    id: "ep-audio-02",
    slug: "mountain-dusk-bgm",
    category: "audio",
    title: "峠の夕暮れBGM（ループ試作・遠景レイヤー付き長題）",
    lead: "山並みと夕焼けをイメージしたループ向けBGM。シーンの余韻を残す静かな展開です。",
    shortDescription: "山並みと夕焼けを描いた、ループ向けの情景BGM。",
    description:
      "峠から見える山並みと夕焼けをイメージした、2分ループの情景BGMです。遠景レイヤーが静かに重なり、シーンの余韻を残す展開になっています。α版ではループ接続点のクロスフェードと遠景パッドのトーン調整が進行中です。",
    highlights: [
      "2分ループで途切れにくい設計",
      "遠景レイヤーによる情景の深み",
      "静かな展開で会話シーンにも合う",
    ],
    tryFocus: [
      "ループ接続点の自然さ",
      "遠景レイヤーの音量バランス",
    ],
    latestUpdate: {
      versionLabel: "α 0.5",
      dateLabel: "1日前",
      title: "ループ接続と遠景トーンを調整",
      changes: [
        "ループ点のクロスフェードを延長",
        "遠景パッドの高域を少し抑えた",
      ],
    },
    feedbackSamples: [
      {
        displayName: "情景サウンド試聴",
        comment: "ループが気にならなくなった。夕暮れの雰囲気がよく出ている。",
        relativeDate: "2日前",
        empathyCount: 4,
      },
      {
        displayName: "ゲーム作曲家",
        comment: "遠景レイヤーの分離がきれい。会話シーンの下でも邪魔にならない。",
        relativeDate: "5日前",
        empathyCount: 3,
      },
    ],
    creatorName: "情景サウンド",
    creatorInitials: "情",
    phase: "α版",
    thumbnailSrc: `${ASSET}/audio/bgm-landscape.svg`,
    thumbnailAlt: "夕暮れの山並みを描いたBGMアートワーク",
    feedbackCount: 11,
    followCount: 24,
    primaryUsageCount: 61,
    updatedAt: "2026-07-20T14:00:00.000Z",
    publishedAt: "2026-06-20T00:00:00.000Z",
    updatedLabel: "1日前に更新",
    featured: true,
    kind: "BGM",
    tags: ["ループ", "情景"],
    durationLabel: "2分00秒",
    listeningContext: "ゲームの夕暮れシーンや、静かな作業BGMとして",
  },
  {
    id: "ep-audio-03",
    slug: "ui-click-set",
    category: "audio",
    title: "UIクリックセット",
    lead: "ボタンと通知用の短い効果音パック。",
    shortDescription: "ボタンと通知向けの短いUI効果音パック。",
    description:
      "アプリやWebサービスのボタン押下、通知到着、切り替えなどに使える短い効果音のセットです。8秒以内の軽量な音源で、UIの操作感を補強する用途を想定しています。試作版ではクリック音のバリエーションと音量の統一が試験中です。",
    highlights: [
      "ボタン・通知・切り替えの3種を収録",
      "短尺でUIに重ねやすい",
      "パック単位でダウンロード可能",
    ],
    tryFocus: ["クリック音の音量統一", "通知音の識別しやすさ"],
    latestUpdate: {
      versionLabel: "試作 0.1",
      dateLabel: "9日前",
      title: "クリック音のバリエーション追加",
      changes: [
        "ソフト／ハードの2種クリックを追加",
        "全音源のピークレベルを統一",
      ],
    },
    feedbackSamples: [],
    creatorName: "Click Craft",
    creatorInitials: "Cl",
    phase: "試作版",
    thumbnailSrc: `${ASSET}/audio/sfx-wave.svg`,
    thumbnailAlt: "波形が表示された効果音のビジュアル",
    feedbackCount: 0,
    followCount: 0,
    primaryUsageCount: 5,
    updatedAt: "2026-07-12T00:00:00.000Z",
    publishedAt: "2026-07-11T00:00:00.000Z",
    updatedLabel: "9日前に更新",
    featured: false,
    kind: "効果音・ジングル",
    tags: ["UI", "パック"],
    durationLabel: "0分08秒",
    listeningContext: "アプリやWebの操作フィードバックとして",
  },
  {
    id: "ep-audio-04",
    slug: "guide-voice-draft",
    category: "audio",
    title: "案内ボイス試作",
    lead: "アプリ導線向けの短いボイス収録サンプル。",
    shortDescription: "アプリ導線向けの短い案内ボイス収録サンプル。",
    description:
      "アプリの初回起動や機能案内に使える、25秒の短いボイス収録サンプルです。落ち着いたトーンで操作手順を伝える構成で、導線の途中で流す想定です。β版では読み上げ速度の調整と無音区間のトリムが行われています。",
    highlights: [
      "25秒で1導線分をカバー",
      "落ち着いたトーンで聴き取りやすい",
      "無音区間をトリム済み",
    ],
    tryFocus: ["読み上げ速度と聴き取りやすさ", "導線の切れ目での自然さ"],
    latestUpdate: {
      versionLabel: "β 0.2",
      dateLabel: "2日前",
      title: "読み上げ速度と無音トリム",
      changes: [
        "案内文の読み速度を5%遅く調整",
        "前後の無音を0.2秒にトリム",
      ],
    },
    feedbackSamples: [
      {
        displayName: "UXデザイナー",
        comment: "速度がちょうどよくなった。導線の途中で流しても邪魔にならない。",
        relativeDate: "1日前",
        empathyCount: 2,
      },
      {
        displayName: "アプリ開発者",
        comment: "無音トリムがあると実装が楽。もう少しバリエーションが欲しい。",
        relativeDate: "4日前",
        empathyCount: 1,
      },
    ],
    creatorName: "Booth Mic",
    creatorInitials: "Bo",
    phase: "β版",
    thumbnailSrc: `${ASSET}/audio/voice-booth.svg`,
    thumbnailAlt: "マイクと収録ブースを示す音声ビジュアル",
    feedbackCount: 5,
    followCount: 8,
    primaryUsageCount: 23,
    updatedAt: "2026-07-19T06:00:00.000Z",
    publishedAt: "2026-07-01T00:00:00.000Z",
    updatedLabel: "2日前に更新",
    featured: false,
    kind: "ボイス",
    tags: ["案内"],
    durationLabel: "0分25秒",
    listeningContext: "アプリの初回起動や機能案内のナレーションとして",
  },
  {
    id: "ep-audio-05",
    slug: "night-train-dialogue",
    category: "audio",
    title: "夜汽車の対話",
    lead: "二人の乗客が語る短い音声ドラマ。",
    shortDescription: "夜汽車の車内で二人の乗客が語る短い音声ドラマ。",
    description:
      "夜行列車の車内で、見知らぬ二人の乗客が短い会話を交わす音声ドラマです。8分40秒の物語で、車窓の景色と会話の間が交互に続きます。α版では車内環境音のミックスバランスとセリフ間の間合いが調整されています。",
    highlights: [
      "8分40秒の短編ドラマ構成",
      "車内環境音と会話のミックス",
      "物語の結末が印象に残る展開",
    ],
    tryFocus: [
      "車内環境音とセリフのバランス",
      "会話の間合いと物語のテンポ",
    ],
    latestUpdate: {
      versionLabel: "α 0.4",
      dateLabel: "今日",
      title: "車内環境音のミックス調整",
      changes: [
        "走行音の低域を少し抑えた",
        "セリフ間の間を0.3秒延長",
      ],
    },
    feedbackSamples: [
      {
        displayName: "車窓リスナー",
        comment: "環境音と会話のバランスがよくなった。結末が印象的。",
        relativeDate: "今日",
        empathyCount: 5,
      },
      {
        displayName: "音声ドラマ好き",
        comment: "8分で一話完結するのがちょうどいい。もう少しキャラの掛け合いが欲しい。",
        relativeDate: "2日前",
        empathyCount: 3,
      },
      {
        displayName: "夜更かし聴取",
        comment: "車窓の音が臨場感ある。ヘッドホン推奨と書いてあるのが親切。",
        relativeDate: "4日前",
        empathyCount: 2,
      },
    ],
    creatorName: "車窓ラジオ",
    creatorInitials: "車",
    phase: "α版",
    thumbnailSrc: `${ASSET}/audio/drama-stage.svg`,
    thumbnailAlt: "舞台幕とタイトルを配した音声ドラマのアート",
    feedbackCount: 19,
    followCount: 41,
    primaryUsageCount: 100,
    updatedAt: "2026-07-21T01:00:00.000Z",
    publishedAt: "2026-07-18T00:00:00.000Z",
    updatedLabel: "今日更新",
    featured: true,
    kind: "朗読・音声ドラマ",
    genre: "ドラマ",
    tags: ["物語", "短編"],
    durationLabel: "8分40秒",
    listeningContext: "ヘッドホン推奨。夜のリラックスタイムや通勤中の聴取向け",
  },
  {
    id: "ep-audio-06",
    slug: "rain-layer",
    category: "audio",
    title: "雨音レイヤー",
    lead: "作業用の環境音レイヤー。",
    shortDescription: "作業に重ねやすい、雨音の環境音レイヤー。",
    description:
      "作業や集中時に重ねて使える、10分ループの雨音環境音レイヤーです。強すぎない音量設計で、他の音源や会話の下にも敷きやすいバランスです。正式版ではループ接続の自然さと雨粒のトーンを整えています。",
    highlights: [
      "10分ループで長時間の作業に対応",
      "他音源の下に敷きやすい音量",
      "雨粒のトーンが耳に優しい",
    ],
    tryFocus: ["ループ接続点の聴き心地", "他のBGMとの重ね方"],
    latestUpdate: {
      versionLabel: "ver 1.1",
      dateLabel: "21日前",
      title: "ループ接続と雨粒トーンの調整",
      changes: [
        "ループ点のフェードを滑らかに",
        "高域の雨粒音を少し抑えた",
      ],
    },
    feedbackSamples: [
      {
        displayName: "作業BGM派",
        comment: "ループが気にならない。他の音楽の下に敷いても邪魔にならない。",
        relativeDate: "3週間前",
        empathyCount: 1,
      },
    ],
    creatorName: "Ambi Lab",
    creatorInitials: "Am",
    phase: "正式版公開済み",
    thumbnailSrc: null,
    thumbnailAlt: "音楽・音声のサムネイル未設定",
    feedbackCount: 2,
    followCount: 6,
    primaryUsageCount: 19,
    updatedAt: "2026-06-30T00:00:00.000Z",
    publishedAt: "2026-06-28T00:00:00.000Z",
    updatedLabel: "21日前に更新",
    featured: false,
    kind: "BGM",
    tags: ["環境音"],
    durationLabel: "10分00秒",
    listeningContext: "作業・読書・集中時の環境音として",
  },

  // —— dev-tool (6) ——
  {
    id: "ep-tool-01",
    slug: "json-csv-convert",
    category: "dev-tool",
    title: "JSON→CSV変換",
    lead: "ブラウザ上で表形式へ変換する小さなツール。",
    shortDescription: "ブラウザ上でJSONを表形式へ変換する小さなツール。",
    description:
      "JSONデータをブラウザ上でCSV形式に変換するシンプルなツールです。サーバーへデータを送らずにローカルで処理するため、社内データの試験変換にも使えます。正式版ではネストしたオブジェクトの展開と文字コードの選択が追加されています。",
    highlights: [
      "ブラウザ内で完結、データを外部送信しない",
      "ネストしたJSONの展開に対応",
      "変換結果をその場でコピー可能",
    ],
    tryFocus: ["ネストしたJSONの展開結果", "文字コード選択と出力形式"],
    latestUpdate: {
      versionLabel: "ver 1.5",
      dateLabel: "5日前",
      title: "ネスト展開と文字コード選択",
      changes: [
        "3階層までのネスト展開を追加",
        "UTF-8／Shift_JISの出力選択を追加",
      ],
    },
    feedbackSamples: [
      {
        displayName: "データ担当",
        comment: "ネスト展開が便利。社内データの試験変換に使っている。",
        relativeDate: "4日前",
        empathyCount: 11,
      },
      {
        displayName: "フロントエンド",
        comment: "ブラウザ内完結が安心。文字コード選択があると助かる。",
        relativeDate: "1週間前",
        empathyCount: 7,
      },
      {
        displayName: "業務効率化",
        comment: "UIがシンプルで迷わない。大量データの上限表示があると尚よい。",
        relativeDate: "2週間前",
        empathyCount: 5,
      },
    ],
    creatorName: "Format Desk",
    creatorInitials: "Fo",
    phase: "正式版公開済み",
    thumbnailSrc: `${ASSET}/dev-tool/browser-convert.svg`,
    thumbnailAlt: "JSONからCSVへ変換するブラウザツール画面",
    feedbackCount: 41,
    followCount: 77,
    primaryUsageCount: 184,
    updatedAt: "2026-07-16T10:00:00.000Z",
    publishedAt: "2026-01-15T00:00:00.000Z",
    updatedLabel: "5日前に更新",
    featured: true,
    kind: "ブラウザツール",
    tags: ["変換", "データ"],
    environments: ["Webブラウザ"],
    usageMethod: "ブラウザで利用",
    targetUsers: "データ整形が必要な開発者・業務担当者",
    prerequisites: "モダンブラウザ（Chrome / Firefox / Safari 最新版）",
  },
  {
    id: "ep-tool-02",
    slug: "forge-lint-vscode",
    category: "dev-tool",
    title: "Forge Lint for VS Code（ルールセット試作・長めの拡張機能名）",
    lead: "保存時に命名と導線の揺れを指摘するエディタ拡張。チーム内ルールのたたき台向けです。",
    shortDescription:
      "保存時に命名と導線の揺れを指摘するVS Code拡張。",
    description:
      "VS Code上でファイル保存時に、命名規則やUI導線の揺れを指摘するエディタ拡張です。チーム内ルールのたたき台として使え、カスタムルールセットの読み込みにも対応しています。β版ではルールの優先度表示と自動修正の候補提示が追加されています。",
    highlights: [
      "保存時にリアルタイムで指摘",
      "カスタムルールセットの読み込み",
      "命名と導線の揺れを同時チェック",
    ],
    tryFocus: [
      "保存時の指摘内容と優先度",
      "カスタムルールセットの読み込み",
    ],
    latestUpdate: {
      versionLabel: "β 0.7",
      dateLabel: "1日前",
      title: "ルール優先度と自動修正候補",
      changes: [
        "指摘に優先度バッジを表示",
        "命名の自動修正候補を提示",
      ],
    },
    feedbackSamples: [
      {
        displayName: "チームリード",
        comment: "優先度表示で対応順が決めやすい。ルールセットの共有が楽。",
        relativeDate: "2日前",
        empathyCount: 5,
      },
      {
        displayName: "VS Codeユーザー",
        comment: "保存時の指摘が邪魔にならない設定があると嬉しい。",
        relativeDate: "5日前",
        empathyCount: 3,
      },
    ],
    creatorName: "Rule Forge",
    creatorInitials: "Ru",
    phase: "β版",
    thumbnailSrc: `${ASSET}/dev-tool/editor-plugin.svg`,
    thumbnailAlt: "エディタサイドバーと拡張パネルの画面",
    feedbackCount: 18,
    followCount: 33,
    primaryUsageCount: 82,
    updatedAt: "2026-07-20T11:00:00.000Z",
    publishedAt: "2026-05-01T00:00:00.000Z",
    updatedLabel: "1日前に更新",
    featured: true,
    kind: "プラグイン・拡張機能",
    tags: ["lint", "VS Code"],
    environments: ["Visual Studio Code", "macOS"],
    usageMethod: "プラグイン・拡張機能として利用",
    targetUsers: "チームでコーディング規約を揃えたい開発者",
    prerequisites: "VS Code 1.85以降、Node.js 18以降（ルール開発時）",
  },
  {
    id: "ep-tool-03",
    slug: "node-graph-lab",
    category: "dev-tool",
    title: "Node Graph Lab",
    lead: "ノードをつないで変換フローを試す。",
    shortDescription: "ノードをつないで変換フローを試せるブラウザ実験ツール。",
    description:
      "入力・変換・出力のノードをドラッグでつなぎ、データ変換フローを視覚的に試せるブラウザツールです。パイプラインのたたき台づくりや、変換手順の共有に使えます。α版ではノードの複製とフローのエクスポートが試験導入されています。",
    highlights: [
      "ドラッグでノードを接続",
      "変換フローを視覚的に確認",
      "フローのエクスポートに対応",
    ],
    tryFocus: ["ノード接続と変換結果のプレビュー", "フローのエクスポート形式"],
    latestUpdate: {
      versionLabel: "α 0.3",
      dateLabel: "12日前",
      title: "ノード複製とフローエクスポート",
      changes: [
        "ノードの複製ショートカットを追加",
        "JSON形式でのフローエクスポートを試験導入",
      ],
    },
    feedbackSamples: [],
    creatorName: "Graph Nest",
    creatorInitials: "Gr",
    phase: "α版",
    thumbnailSrc: `${ASSET}/dev-tool/node-workflow.svg`,
    thumbnailAlt: "入力・変換・出力がつながったノードワークフロー",
    feedbackCount: 0,
    followCount: 4,
    primaryUsageCount: 14,
    updatedAt: "2026-07-09T00:00:00.000Z",
    publishedAt: "2026-07-07T00:00:00.000Z",
    updatedLabel: "12日前に更新",
    featured: false,
    kind: "生成・変換ツール",
    tags: ["ワークフロー"],
    environments: ["Webブラウザ", "Windows"],
    usageMethod: "ブラウザで利用",
    targetUsers: "データ変換フローを試したい開発者",
    prerequisites: "モダンブラウザ、JSONの基本理解",
  },
  {
    id: "ep-tool-04",
    slug: "forge-cli",
    category: "dev-tool",
    title: "forge-cli",
    lead: "ビルド監視向けの小さなCLI。",
    shortDescription: "ビルド監視向けの軽量CLIツール。",
    description:
      "プロジェクトのビルドを監視し、変更検知時に自動で再ビルドする小さなCLIツールです。設定ファイル1つで監視対象と除外パターンを指定できます。試作版では差分ビルドの高速化とログ出力の整理が進行中です。",
    highlights: [
      "ファイル変更の自動検知と再ビルド",
      "設定ファイルで除外パターンを指定",
      "差分ビルドで高速化",
    ],
    tryFocus: ["変更検知から再ビルドまでの速度", "ログ出力の見やすさ"],
    latestUpdate: {
      versionLabel: "試作 0.3",
      dateLabel: "今日",
      title: "差分ビルドの高速化",
      changes: [
        "変更ファイルのみの再ビルドを試験導入",
        "ログ出力をタイムスタンプ付きに整理",
      ],
    },
    feedbackSamples: [
      {
        displayName: "CLI常連",
        comment: "差分ビルドで体感が速くなった。設定ファイルの例があると助かる。",
        relativeDate: "今日",
        empathyCount: 3,
      },
      {
        displayName: "ビルド担当",
        comment: "ログが見やすくなった。除外パターンの書き方をもう少し詳しく。",
        relativeDate: "2日前",
        empathyCount: 2,
      },
    ],
    creatorName: "Shell Bits",
    creatorInitials: "Sh",
    phase: "試作版",
    thumbnailSrc: `${ASSET}/dev-tool/cli-terminal.svg`,
    thumbnailAlt: "ターミナルで forge build を実行する画面",
    feedbackCount: 9,
    followCount: 0,
    primaryUsageCount: 5,
    updatedAt: "2026-07-21T02:00:00.000Z",
    publishedAt: "2026-07-15T00:00:00.000Z",
    updatedLabel: "今日更新",
    featured: false,
    kind: "CLI",
    tags: ["ビルド"],
    environments: ["macOS", "Linux"],
    usageMethod: "CLIで利用",
    targetUsers: "ローカル開発でビルド監視が必要な開発者",
    prerequisites: "Node.js 20以降、ターミナル操作の基本",
  },
  {
    id: "ep-tool-05",
    slug: "api-console-lite",
    category: "dev-tool",
    title: "API Console Lite",
    lead: "エンドポイントを叩いてレスポンスを確認する。",
    shortDescription: "エンドポイントを叩いてレスポンスを確認するAPIコンソール。",
    description:
      "HTTPエンドポイントにリクエストを送り、レスポンスのステータス・ヘッダー・ボディを確認できるブラウザツールです。開発中のAPI動作確認や、チーム内でのエンドポイント共有に使えます。α版ではリクエスト履歴の保存と環境変数の切り替えが追加されています。",
    highlights: [
      "GET/POST/PUT/DELETEに対応",
      "レスポンスの整形表示",
      "リクエスト履歴の保存",
    ],
    tryFocus: [
      "リクエスト送信とレスポンス整形",
      "環境変数の切り替えと履歴保存",
    ],
    latestUpdate: {
      versionLabel: "α 0.8",
      dateLabel: "3日前",
      title: "履歴保存と環境変数切り替え",
      changes: [
        "直近10件のリクエスト履歴を保存",
        "開発／ステージングの環境切り替えを追加",
      ],
    },
    feedbackSamples: [
      {
        displayName: "API開発者",
        comment: "履歴保存があると同じリクエストの再送が楽。環境切り替えも便利。",
        relativeDate: "2日前",
        empathyCount: 8,
      },
      {
        displayName: "バックエンド",
        comment: "レスポンス整形が見やすい。認証ヘッダーのテンプレがあると尚よい。",
        relativeDate: "4日前",
        empathyCount: 5,
      },
      {
        displayName: "QA担当",
        comment: "チームでエンドポイント共有するのに使っている。履歴のエクスポート欲しい。",
        relativeDate: "1週間前",
        empathyCount: 4,
      },
    ],
    creatorName: "Request Pad",
    creatorInitials: "Re",
    phase: "α版",
    thumbnailSrc: `${ASSET}/dev-tool/api-console.svg`,
    thumbnailAlt: "GETリクエストとJSONレスポンスのAPIコンソール",
    feedbackCount: 27,
    followCount: 52,
    primaryUsageCount: 126,
    updatedAt: "2026-07-18T16:00:00.000Z",
    publishedAt: "2026-04-20T00:00:00.000Z",
    updatedLabel: "3日前に更新",
    featured: true,
    kind: "API",
    tags: ["HTTP", "デバッグ"],
    environments: ["Webブラウザ"],
    usageMethod: "APIとして利用",
    targetUsers: "API開発・動作確認を行う開発者",
    prerequisites: "HTTPの基本知識、モダンブラウザ",
  },
  {
    id: "ep-tool-06",
    slug: "sprite-pack-sdk",
    category: "dev-tool",
    title: "Sprite Pack SDK",
    lead: "アセット変換をコードから呼ぶSDK試作。",
    shortDescription: "ゲームエンジンからアセット変換を呼ぶSDK試作。",
    description:
      "スプライトシートやアニメーションアセットの変換処理を、UnityやGodotのコードから呼び出せるSDKです。ビルドパイプラインへの組み込みを想定した設計で、β版ではバッチ変換と進捗コールバックが試験導入されています。",
    highlights: [
      "Unity / Godot両対応",
      "ビルドパイプラインへの組み込み",
      "バッチ変換と進捗コールバック",
    ],
    tryFocus: [
      "バッチ変換の速度と進捗表示",
      "エンジンごとのAPI差異",
    ],
    latestUpdate: {
      versionLabel: "β 0.4",
      dateLabel: "19日前",
      title: "バッチ変換と進捗コールバック",
      changes: [
        "複数ファイルの一括変換を追加",
        "変換進捗のコールバックAPIを公開",
      ],
    },
    feedbackSamples: [
      {
        displayName: "Unity開発",
        comment: "バッチ変換が便利。進捗コールバックでUIに表示できる。",
        relativeDate: "2週間前",
        empathyCount: 2,
      },
      {
        displayName: "Godot使い",
        comment: "Godot側のAPIドキュメントがもう少しあると助かる。",
        relativeDate: "3週間前",
        empathyCount: 1,
      },
    ],
    creatorName: "Pack Orbit",
    creatorInitials: "Pa",
    phase: "β版",
    thumbnailSrc: null,
    thumbnailAlt: "開発ツールのサムネイル未設定",
    feedbackCount: 4,
    followCount: 12,
    primaryUsageCount: 33,
    updatedAt: "2026-07-02T00:00:00.000Z",
    publishedAt: "2026-06-25T00:00:00.000Z",
    updatedLabel: "19日前に更新",
    featured: false,
    kind: "ライブラリ・SDK",
    tags: ["アセット", "SDK"],
    environments: ["Unity", "Godot"],
    usageMethod: "ライブラリ・SDKとして利用",
    targetUsers: "ゲームアセットの変換パイプラインを組む開発者",
    prerequisites: "Unity 2022以降またはGodot 4.x、C#の基本",
  },

  // —— service-app (6) ——
  {
    id: "ep-svc-01",
    slug: "habit-leaf",
    category: "service-app",
    title: "Habit Leaf",
    lead: "毎日の小さな習慣をチェックする。",
    shortDescription: "毎日の小さな習慣をチェックする習慣トラッカー。",
    description:
      "毎日の小さな習慣をチェックリストで管理するスマホアプリです。連続記録の可視化と、週次の振り返りで習慣の継続をサポートします。正式版ではリマインド通知の時間帯設定と、習慣の並び替えが追加されています。",
    highlights: [
      "連続記録をひと目で確認",
      "週次の振り返り画面",
      "iOS / Android両対応",
    ],
    tryFocus: [
      "習慣の追加とチェック操作",
      "リマインド通知の時間帯設定",
    ],
    latestUpdate: {
      versionLabel: "ver 2.1",
      dateLabel: "4日前",
      title: "リマインド時間帯と並び替え",
      changes: [
        "習慣ごとのリマインド時間を設定可能に",
        "ドラッグで習慣の並び替えを追加",
      ],
    },
    feedbackSamples: [
      {
        displayName: "習慣化チャレンジ",
        comment: "リマインドの時間帯設定があると続けやすい。連続記録がモチベになる。",
        relativeDate: "3日前",
        empathyCount: 14,
      },
      {
        displayName: "朝活ユーザー",
        comment: "並び替えで重要な習慣を上に置ける。UIがすっきりしている。",
        relativeDate: "1週間前",
        empathyCount: 9,
      },
      {
        displayName: "生活改善派",
        comment: "週次振り返りが良い。月次の統計もあると嬉しい。",
        relativeDate: "2週間前",
        empathyCount: 6,
      },
    ],
    creatorName: "Leaf Apps",
    creatorInitials: "Le",
    phase: "正式版公開済み",
    thumbnailSrc: `${ASSET}/service-app/habit-tracker.svg`,
    thumbnailAlt: "習慣チェックリストのアプリ画面",
    feedbackCount: 52,
    followCount: 110,
    primaryUsageCount: 261,
    updatedAt: "2026-07-17T08:00:00.000Z",
    publishedAt: "2025-11-01T00:00:00.000Z",
    updatedLabel: "4日前に更新",
    featured: true,
    kind: "スマートフォンアプリ",
    tags: ["習慣", "生活"],
    environments: ["iOS", "Android"],
    intendedUsers: "毎日の小さな習慣を続けたい人",
    problemSolved: "習慣の継続が見えにくく、途中でやめてしまう",
    usageScenes: ["朝のルーティン管理", "運動・読書などの継続記録"],
  },
  {
    id: "ep-svc-02",
    slug: "recall-deck",
    category: "service-app",
    title: "暗記デッキ：光合成から歴史年号まで横断する学習カード（長題）",
    lead: "表裏カードで思い出し練習をする学習サービス。分野をまたいだデッキ共有も想定しています。",
    shortDescription: "表裏カードで思い出し練習する、分野横断の学習サービス。",
    description:
      "表裏カードで思い出し練習を行う学習Webサービスです。光合成から歴史年号まで分野をまたいだデッキを作成・共有でき、忘却曲線に基づく復習スケジュールも試験導入中です。β版ではデッキ共有リンクと復習リマインドが追加されています。",
    highlights: [
      "分野横断のデッキ作成・共有",
      "忘却曲線ベースの復習スケジュール",
      "長いタイトルのデッキも一覧で表示",
    ],
    tryFocus: [
      "カードの表裏めくりと思い出し操作",
      "デッキ共有リンクと復習リマインド",
    ],
    latestUpdate: {
      versionLabel: "β 0.6",
      dateLabel: "1日前",
      title: "デッキ共有と復習リマインド",
      changes: [
        "デッキの共有リンクを生成可能に",
        "復習タイミングのプッシュ通知を試験導入",
      ],
    },
    feedbackSamples: [
      {
        displayName: "受験生",
        comment: "共有リンクで友達とデッキを交換できるのが便利。復習リマインドも助かる。",
        relativeDate: "2日前",
        empathyCount: 6,
      },
      {
        displayName: "教師",
        comment: "分野横断のデッキが作りやすい。クラス共有用の権限設定があると嬉しい。",
        relativeDate: "4日前",
        empathyCount: 4,
      },
    ],
    creatorName: "Recall School",
    creatorInitials: "Re",
    phase: "β版",
    thumbnailSrc: `${ASSET}/service-app/study-deck.svg`,
    thumbnailAlt: "学習用フラッシュカードの画面",
    feedbackCount: 21,
    followCount: 45,
    primaryUsageCount: 110,
    updatedAt: "2026-07-20T09:00:00.000Z",
    publishedAt: "2026-05-20T00:00:00.000Z",
    updatedLabel: "1日前に更新",
    featured: true,
    kind: "Webサービス",
    tags: ["学習", "カード"],
    environments: ["Webブラウザ", "iOS"],
    intendedUsers: "暗記・思い出し練習をしたい学習者",
    problemSolved: "紙のカードでは共有・復習タイミングの管理が難しい",
    usageScenes: ["受験勉強の暗記", "語学学習のフレーズ復習", "チームでのデッキ共有"],
  },
  {
    id: "ep-svc-03",
    slug: "sticky-board",
    category: "service-app",
    title: "付箋ボード",
    lead: "アイデアを色分けして並べる情報整理。",
    shortDescription: "アイデアを色分けして並べる付箋ボード型の整理ツール。",
    description:
      "色分けした付箋をボード上に自由に配置し、アイデアやタスクを視覚的に整理するWebサービスです。ドラッグで並べ替え、色でカテゴリ分けができます。α版では付箋のグループ化とボードのエクスポートが試験導入されています。",
    highlights: [
      "色分けでカテゴリを視覚化",
      "ドラッグで自由に配置",
      "ボードのエクスポートに対応",
    ],
    tryFocus: ["付箋の追加・色分け・配置", "グループ化とエクスポート"],
    latestUpdate: {
      versionLabel: "α 0.2",
      dateLabel: "10日前",
      title: "グループ化とボードエクスポート",
      changes: [
        "複数付箋のグループ化を試験導入",
        "PNG形式でのボードエクスポートを追加",
      ],
    },
    feedbackSamples: [],
    creatorName: "Note Nest",
    creatorInitials: "No",
    phase: "α版",
    thumbnailSrc: `${ASSET}/service-app/notes-board.svg`,
    thumbnailAlt: "色付き付箋が並ぶ整理ボード",
    feedbackCount: 0,
    followCount: 2,
    primaryUsageCount: 9,
    updatedAt: "2026-07-11T00:00:00.000Z",
    publishedAt: "2026-07-10T00:00:00.000Z",
    updatedLabel: "10日前に更新",
    featured: false,
    kind: "Webサービス",
    tags: ["整理"],
    environments: ["Webブラウザ"],
    intendedUsers: "アイデア出しやタスク整理を視覚的に行いたい人",
    problemSolved: "テキストリストだけではアイデアの関係が見えにくい",
    usageScenes: ["ブレインストーミング", "プロジェクトのタスク整理"],
  },
  {
    id: "ep-svc-04",
    slug: "household-lite",
    category: "service-app",
    title: "家計ライト",
    lead: "カテゴリ別の支出割合をざっくり把握。",
    shortDescription: "カテゴリ別の支出割合をざっくり把握する家計アプリ。",
    description:
      "日々の支出をカテゴリ別に記録し、円グラフと棒グラフで割合をざっくり把握できるデスクトップアプリです。細かい仕訳より、大まかな支出傾向の把握を重視した設計です。試作版では月次レポートのPDF出力と、カテゴリのカスタマイズが追加されています。",
    highlights: [
      "カテゴリ別の円グラフ・棒グラフ",
      "月次レポートのPDF出力",
      "カテゴリのカスタマイズ",
    ],
    tryFocus: [
      "支出入力とグラフ表示",
      "月次レポートとカテゴリ設定",
    ],
    latestUpdate: {
      versionLabel: "試作 0.4",
      dateLabel: "今日",
      title: "月次レポートとカテゴリカスタマイズ",
      changes: [
        "月次レポートのPDF出力を追加",
        "カテゴリ名と色のカスタマイズを可能に",
      ],
    },
    feedbackSamples: [
      {
        displayName: "家計見直し",
        comment: "ざっくり把握にちょうどいい。PDF出力で家族と共有しやすい。",
        relativeDate: "今日",
        empathyCount: 3,
      },
      {
        displayName: "デスクトップ派",
        comment: "カテゴリカスタマイズがあると自分の支出に合わせられる。",
        relativeDate: "2日前",
        empathyCount: 2,
      },
    ],
    creatorName: "Coin Home",
    creatorInitials: "Co",
    phase: "試作版",
    thumbnailSrc: `${ASSET}/service-app/budget-home.svg`,
    thumbnailAlt: "家計の円グラフと棒グラフの画面",
    feedbackCount: 8,
    followCount: 0,
    primaryUsageCount: 5,
    updatedAt: "2026-07-21T03:00:00.000Z",
    publishedAt: "2026-07-16T00:00:00.000Z",
    updatedLabel: "今日更新",
    featured: false,
    kind: "デスクトップアプリ",
    tags: ["家計", "生活"],
    environments: ["Windows", "macOS"],
    intendedUsers: "家計の大まかな傾向を把握したい人",
    problemSolved: "細かい家計簿は続かず、支出の傾向が掴みにくい",
    usageScenes: ["月末の支出振り返り", "カテゴリ別の割合確認"],
  },
  {
    id: "ep-svc-05",
    slug: "circle-feed",
    category: "service-app",
    title: "Circle Feed",
    lead: "小さなコミュニティ向けの投稿フィード。",
    shortDescription: "小さなコミュニティ向けの投稿フィードサービス。",
    description:
      "少人数のコミュニティ向けに設計された投稿フィードWebサービスです。共感ボタンと短い投稿で、大規模SNSより静かなやりとりを重視しています。α版では投稿の下書き保存と、メンバー招待リンクが追加されています。",
    highlights: [
      "少人数向けの静かなフィード設計",
      "共感ボタンで気軽に反応",
      "投稿の下書き保存",
    ],
    tryFocus: [
      "投稿と共感ボタンの操作感",
      "下書き保存とメンバー招待",
    ],
    latestUpdate: {
      versionLabel: "α 0.7",
      dateLabel: "2日前",
      title: "下書き保存とメンバー招待",
      changes: [
        "投稿の下書き自動保存を追加",
        "招待リンクでメンバー追加を可能に",
      ],
    },
    feedbackSamples: [
      {
        displayName: "サークル運営",
        comment: "少人数向けの設計がちょうどいい。招待リンクでメンバー追加が楽。",
        relativeDate: "1日前",
        empathyCount: 7,
      },
      {
        displayName: "コミュニティ参加者",
        comment: "共感ボタンが気軽で良い。下書き保存があると投稿しやすい。",
        relativeDate: "3日前",
        empathyCount: 5,
      },
      {
        displayName: "小規模チーム",
        comment: "大規模SNSより静かで使いやすい。通知の頻度設定があると尚よい。",
        relativeDate: "5日前",
        empathyCount: 4,
      },
    ],
    creatorName: "Circle Soft",
    creatorInitials: "Ci",
    phase: "α版",
    thumbnailSrc: `${ASSET}/service-app/community-feed.svg`,
    thumbnailAlt: "投稿と共感ボタンのあるコミュニティ画面",
    feedbackCount: 30,
    followCount: 64,
    primaryUsageCount: 154,
    updatedAt: "2026-07-19T12:00:00.000Z",
    publishedAt: "2026-03-30T00:00:00.000Z",
    updatedLabel: "2日前に更新",
    featured: true,
    kind: "Webサービス",
    tags: ["コミュニティ", "AI"],
    environments: ["Webブラウザ", "Android"],
    intendedUsers: "少人数のコミュニティで気軽に交流したい人",
    problemSolved: "大規模SNSでは投稿の心理的ハードルが高い",
    usageScenes: ["趣味サークルの情報共有", "少人数チームの日常報告"],
  },
  {
    id: "ep-svc-06",
    slug: "tab-reminder-bot",
    category: "service-app",
    title: "Tab Reminder Bot",
    lead: "リマインドをチャットへ届けるBot試作。",
    shortDescription: "リマインドをチャットへ届けるBot試作サービス。",
    description:
      "指定した時刻にリマインドメッセージをチャットへ届けるBot試作です。Webブラウザ上のチャット画面と連携し、タブを開いている間に通知を受け取れます。β版では繰り返しリマインドと、メッセージテンプレートが試験導入されています。",
    highlights: [
      "チャット画面へリマインドを配信",
      "繰り返しリマインドに対応",
      "メッセージテンプレートで定型文を登録",
    ],
    tryFocus: [
      "リマインドの登録とチャット配信",
      "繰り返し設定とテンプレート",
    ],
    latestUpdate: {
      versionLabel: "β 0.3",
      dateLabel: "18日前",
      title: "繰り返しリマインドとテンプレート",
      changes: [
        "毎日・毎週の繰り返し設定を追加",
        "メッセージテンプレートの登録機能を試験導入",
      ],
    },
    feedbackSamples: [
      {
        displayName: "リマインド試用",
        comment: "チャットに届くのが自然。繰り返し設定があると実用的。",
        relativeDate: "2週間前",
        empathyCount: 2,
      },
      {
        displayName: "Bot好き",
        comment: "テンプレートがあると定型のリマインドが楽。タブを閉じた後の通知は？",
        relativeDate: "3週間前",
        empathyCount: 1,
      },
    ],
    creatorName: "Bot Lane",
    creatorInitials: "Bo",
    phase: "β版",
    thumbnailSrc: null,
    thumbnailAlt: "Webサービス・アプリのサムネイル未設定",
    feedbackCount: 6,
    followCount: 9,
    primaryUsageCount: 26,
    updatedAt: "2026-07-03T00:00:00.000Z",
    publishedAt: "2026-07-01T00:00:00.000Z",
    updatedLabel: "18日前に更新",
    featured: false,
    kind: "Bot",
    tags: ["リマインド"],
    environments: ["Webブラウザ"],
    intendedUsers: "チャット上でリマインドを受け取りたい人",
    problemSolved: "別アプリの通知だと見落としやすい",
    usageScenes: ["作業中のタブ内リマインド", "チームチャットへの定期通知"],
  },
];

export type ExplorePrototypeShelfId = "updated" | "newest";

export type ExplorePrototypeShelf = {
  id: ExplorePrototypeShelfId;
  title: string;
  works: ExplorePrototypeWork[];
  /** Optional “すべて見る” — hub category shelves only */
  seeAllHref?: string;
  seeAllLabel?: string;
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
  const scoreA = a.feedbackCount + a.followCount + a.primaryUsageCount;
  const scoreB = b.feedbackCount + b.followCount + b.primaryUsageCount;
  if (scoreB !== scoreA) return scoreB - scoreA;
  return byUpdatedDesc(a, b);
}

/** Featured slides for category hero — max 4. */
export function getExplorePrototypeFeaturedWorks(
  category: ExplorePrototypeCategorySlug,
): ExplorePrototypeWork[] {
  return getExplorePrototypeWorks(category)
    .filter((work) => work.featured)
    .sort(byEngagementDesc)
    .slice(0, 4);
}

/** Regular shelves only (注目 is the hero carousel). */
export function getExplorePrototypeShelves(
  category: ExplorePrototypeCategorySlug,
): ExplorePrototypeShelf[] {
  const works = getExplorePrototypeWorks(category);
  const updated = [...works].sort(byUpdatedDesc);
  const newest = [...works].sort(byPublishedDesc);

  return [
    { id: "updated", title: "最近更新", works: updated },
    { id: "newest", title: "新着作品", works: newest },
  ];
}

/**
 * Explore hub: one representative featured work per category (4 total).
 */
export function getExplorePrototypeHomeFeatured(): ExplorePrototypeWork[] {
  return EXPLORE_PROTOTYPE_CATEGORY_SLUGS.map((slug) => {
    const featured = getExplorePrototypeFeaturedWorks(slug);
    return featured[0] ?? getExplorePrototypeWorks(slug)[0];
  }).filter((work): work is ExplorePrototypeWork => Boolean(work));
}

/** Hub lower shelves — up to 4 works each + see-all link. */
export function getExplorePrototypeHomeCategoryShelves(): ExplorePrototypeShelf[] {
  const seeAllBySlug: Record<ExplorePrototypeCategorySlug, string> = {
    game: "ゲームをすべて見る",
    audio: "音楽・音声をすべて見る",
    "dev-tool": "開発ツールをすべて見る",
    "service-app": "Webサービス・アプリをすべて見る",
  };

  return EXPLORE_PROTOTYPE_CATEGORIES.map((meta) => {
    const works = [...getExplorePrototypeWorks(meta.slug)]
      .sort(byUpdatedDesc)
      .slice(0, 4);
    return {
      id: "updated" as const,
      title: meta.label,
      works,
      seeAllHref: meta.href,
      seeAllLabel: seeAllBySlug[meta.slug],
    };
  });
}

/** Category-aware primary usage label for discovery stats. */
export function getExplorePrototypePrimaryUsageLabel(
  category: ExplorePrototypeCategorySlug,
): string {
  switch (category) {
    case "game":
      return "プレイヤー";
    case "audio":
      return "リスナー";
    case "dev-tool":
    case "service-app":
      return "利用者";
    default:
      return "利用者";
  }
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

export function getExplorePrototypeWorkBySlug(
  category: ExplorePrototypeCategorySlug,
  slug: string,
): ExplorePrototypeWork | undefined {
  return EXPLORE_PROTOTYPE_WORKS.find(
    (work) => work.category === category && work.slug === slug,
  );
}

export function getExplorePrototypeDetailHref(
  work: ExplorePrototypeWork,
): string {
  return `/explore/prototype/${work.category}/${work.slug}`;
}

export function getExplorePrototypeRelatedWorks(
  work: ExplorePrototypeWork,
  limit = 3,
): ExplorePrototypeWork[] {
  return EXPLORE_PROTOTYPE_WORKS.filter(
    (candidate) =>
      candidate.category === work.category && candidate.id !== work.id,
  )
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return byEngagementDesc(a, b);
    })
    .slice(0, limit);
}

export function getAllExplorePrototypeStaticParams(): Array<{
  category: ExplorePrototypeCategorySlug;
  slug: string;
}> {
  return EXPLORE_PROTOTYPE_WORKS.map((work) => ({
    category: work.category,
    slug: work.slug,
  }));
}

export type ExplorePrototypeBrowseModel = {
  featured: ExplorePrototypeWork[];
  shelves: ExplorePrototypeShelf[];
};

function shelvesFromWorks(works: ExplorePrototypeWork[]): ExplorePrototypeShelf[] {
  const updated = [...works].sort(byUpdatedDesc);
  const newest = [...works].sort(byPublishedDesc);
  return [
    { id: "updated", title: "最近更新", works: updated },
    { id: "newest", title: "新着作品", works: newest },
  ];
}

/** Category list browse model — featured + shelves from fixture. */
export function getExplorePrototypeCategoryBrowse(
  category: ExplorePrototypeCategorySlug,
): ExplorePrototypeBrowseModel {
  const works = getExplorePrototypeWorks(category);
  const featured = works
    .filter((work) => work.featured)
    .sort(byEngagementDesc)
    .slice(0, 4);

  return {
    featured,
    shelves: shelvesFromWorks(works),
  };
}

/** Hub browse model — mixed featured + per-category shelves from fixture. */
export function getExplorePrototypeHubBrowse(): ExplorePrototypeBrowseModel {
  const featured = EXPLORE_PROTOTYPE_CATEGORY_SLUGS.map((slug) => {
    const inCategory = getExplorePrototypeWorks(slug);
    const topFeatured = inCategory
      .filter((work) => work.featured)
      .sort(byEngagementDesc)[0];
    return topFeatured ?? inCategory.sort(byEngagementDesc)[0];
  }).filter((work): work is ExplorePrototypeWork => Boolean(work));

  const seeAllBySlug: Record<ExplorePrototypeCategorySlug, string> = {
    game: "ゲームをすべて見る",
    audio: "音楽・音声をすべて見る",
    "dev-tool": "開発ツールをすべて見る",
    "service-app": "Webサービス・アプリをすべて見る",
  };

  const shelves = EXPLORE_PROTOTYPE_CATEGORIES.map((meta) => {
    const works = [...getExplorePrototypeWorks(meta.slug)]
      .sort(byUpdatedDesc)
      .slice(0, 4);
    return {
      id: "updated" as const,
      title: meta.label,
      works,
      seeAllHref: meta.href,
      seeAllLabel: seeAllBySlug[meta.slug],
    };
  }).filter((shelf) => shelf.works.length > 0);

  return {
    featured,
    shelves,
  };
}
