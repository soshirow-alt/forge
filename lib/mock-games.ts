import { getBuiltInThumbnailUrl, isBuiltInThumbnailId } from "@/lib/demo-thumbnails";

export type Game = {
  id: string;
  title: string;
  genre: string;
  status: string;
  creator: string;
  phase: string;
  description: string;
  lookingForTesters: boolean;
  testerSlots?: number;
  lastUpdated: string;
  section: "new" | "testers" | "beta";
  thumbnailUrl?: string;
  tags: string[];
  playUrl: string;
  steamUrl?: string;
  itchUrl?: string;
  githubUrl?: string;
  discordUrl?: string;
  officialUrl?: string;
  ownerId?: string;
  ownerName?: string;
  visibility?: "public" | "private";
  createdAt?: string;
  estimatedPlayTime?: string;
  focusNotes?: string;
};

export const games: Game[] = [
  {
    id: "emberfall",
    title: "余燼の王国",
    genre: "アクションRPG",
    status: "試作版",
    creator: "灰鉄スタジオ",
    phase: "試作版",
    description:
      "落ちた余燼が禁断の力を授けるダークファンタジーアクションRPG。崩れゆく王国を探索し、呪われた武器を鍛え、内側から燃え上がる世界の運命を決めよ。",
    lookingForTesters: false,
    estimatedPlayTime: "30分〜1時間",
    focusNotes: "序盤の戦闘テンポと、UIの分かりやすさを見てほしい。",
    lastUpdated: "2026-05-28",
    section: "new",
    tags: ["RPG", "アクション"],
    playUrl: "https://ashforge-studio.itch.io/emberfall-demo",
    itchUrl: "https://ashforge-studio.itch.io/emberfall-demo",
    githubUrl: "https://github.com/ashforge-studio/emberfall",
    officialUrl: "https://emberfall.game",
  },
  {
    id: "neon-drift",
    title: "ネオンドリフト",
    genre: "レース",
    status: "企画段階",
    creator: "パルスレーンゲームズ",
    phase: "企画段階",
    description:
      "ネオンに染まった巨大都市を駆け抜ける高速アーケードレース。ドリフトを連鎖させ、交通システムをハックし、企業の賞金稼ぎから逃げ切れ。",
    lookingForTesters: false,
    lastUpdated: "2026-06-01",
    section: "new",
    tags: ["アクション", "短時間"],
    playUrl: "https://pulselane.itch.io/neon-drift-prototype",
    itchUrl: "https://pulselane.itch.io/neon-drift-prototype",
    discordUrl: "https://discord.gg/neondrift",
  },
  {
    id: "hollow-signal",
    title: "虚ろな信号",
    genre: "ホラー",
    status: "プロトタイプ",
    creator: "静電室コレクティブ",
    phase: "プロトタイプ",
    description:
      "放棄された電波にチューニングし、一晩で消えた町の真相を暴く。放送のたびに現実が歪み、向こう側の何かがこちらを聞いている。",
    lookingForTesters: false,
    lastUpdated: "2026-05-15",
    section: "new",
    tags: ["ホラー"],
    playUrl: "https://staticroom.github.io/hollow-signal",
    githubUrl: "https://github.com/staticroom/hollow-signal",
    officialUrl: "https://hollowsignal.dev",
  },
  {
    id: "starbound-tactics",
    title: "星界戦術",
    genre: "ストラテジー",
    status: "初期開発",
    creator: "オービタルマインド",
    phase: "初期開発",
    description:
      "手続き生成された星系を舞台にしたターン制艦隊バトル。異星勢力を招き、補給路を管理し、銀河規模の戦争を繰り広げろ。",
    lookingForTesters: false,
    lastUpdated: "2026-05-20",
    section: "new",
    tags: ["RPG"],
    playUrl: "https://store.steampowered.com/app/2280120/Starbound_Tactics",
    steamUrl: "https://store.steampowered.com/app/2280120/Starbound_Tactics",
    officialUrl: "https://starboundtactics.com",
  },
  {
    id: "iron-covenant",
    title: "鉄の盟約",
    genre: "シューティング",
    status: "試作版",
    creator: "最前線フォージ",
    phase: "試作版",
    description:
      "巨大企業と反逆AI民兵の戦争を描くタクティカルスクワッドシューター。ドローンを投入し、要塞を突破し、任務中にテクノロジーを回収せよ。",
    lookingForTesters: false,
    lastUpdated: "2026-05-10",
    section: "new",
    tags: ["アクション"],
    playUrl: "https://frontlineforge.itch.io/iron-covenant-alpha",
    itchUrl: "https://frontlineforge.itch.io/iron-covenant-alpha",
    githubUrl: "https://github.com/frontlineforge/iron-covenant",
  },
  {
    id: "verdant-echo",
    title: "翠のこだま",
    genre: "アドベンチャー",
    status: "企画段階",
    creator: "キャノピーラボ",
    phase: "企画段階",
    description:
      "森の精霊の記憶を取り戻す手描き風探索ゲーム。環境パズルを解き、茂った廃墟に潜む生き物と友達になろう。",
    lookingForTesters: false,
    lastUpdated: "2026-06-03",
    section: "new",
    tags: ["パズル"],
    playUrl: "https://canopylabs.github.io/verdant-echo",
    githubUrl: "https://github.com/canopylabs/verdant-echo",
  },
  {
    id: "rift-runner",
    title: "リフトランナー",
    genre: "プラットフォーマー",
    status: "テスター募集中",
    creator: "ジャンプカット",
    phase: "α版",
    description:
      "次元を跳ぶモメンタム型プラットフォーマー。ジャンプ中に並行世界を切り替え、パズルを解き、崩壊するリフトから逃げろ。",
    lookingForTesters: true,
    testerSlots: 10,
    estimatedPlayTime: "15〜30分",
    focusNotes: "次元切り替えの操作感と、序盤チュートリアルの分かりやすさを見てほしい。",
    lastUpdated: "2026-06-08",
    section: "testers",
    tags: ["アクション", "パズル", "テスター募集中"],
    playUrl: "https://jumpcut.itch.io/rift-runner-beta",
    itchUrl: "https://jumpcut.itch.io/rift-runner-beta",
    discordUrl: "https://discord.gg/riftrunner",
  },
  {
    id: "crimson-vault",
    title: "深紅の金庫",
    genre: "ローグライク",
    status: "クローズドα版",
    creator: "ディープレッドゲームズ",
    phase: "α版",
    description:
      "ランごとに形を変える知覚するダンジョンへ降下せよ。血に縛られた遺物を集め、モンスター商人と交渉し、金庫の心臓を盗め。",
    lookingForTesters: true,
    testerSlots: 10,
    lastUpdated: "2026-06-05",
    section: "testers",
    tags: ["ローグライク", "テスター募集中"],
    playUrl: "https://store.steampowered.com/app/3310450/Crimson_Vault",
    steamUrl: "https://store.steampowered.com/app/3310450/Crimson_Vault",
    discordUrl: "https://discord.gg/crimsonvault",
  },
  {
    id: "skyforge-arena",
    title: "空炉アリーナ",
    genre: "格闘",
    status: "オープンα版",
    creator: "雲撃開発室",
    phase: "α版",
    description:
      "破壊可能な浮遊アリーナで繰り広げる空中格闘。元素コンボを極め、空中パリィを決め、相手を下の虚無へ叩き落とせ。",
    lookingForTesters: true,
    testerSlots: 10,
    lastUpdated: "2026-06-07",
    section: "testers",
    tags: ["アクション", "テスター募集中"],
    playUrl: "https://cloudstrike-dev.netlify.app/skyforge-arena",
    officialUrl: "https://skyforgearena.jp",
    discordUrl: "https://discord.gg/skyforgearena",
  },
  {
    id: "dust-and-daggers",
    title: "砂と短剣",
    genre: "ステルス",
    status: "フィードバック募集中",
    creator: "サイレントトレイル",
    phase: "α版",
    description:
      "音が視界より遠く届く西部ステルス。砂嵐を隠れ蓑に、列車強盗を妨害し、辺境に目撃者を残すな。",
    lookingForTesters: true,
    testerSlots: 10,
    lastUpdated: "2026-06-02",
    section: "testers",
    tags: ["アクション", "テスター募集中"],
    playUrl: "https://silenttrail.itch.io/dust-and-daggers",
    itchUrl: "https://silenttrail.itch.io/dust-and-daggers",
  },
  {
    id: "pulse-circuit",
    title: "パルス回路",
    genre: "パズル",
    status: "プレイテスト受付中",
    creator: "ロジックループ",
    phase: "α版",
    description:
      "死にゆくメインフレーム内の生きた回路を配線し直せ。データストリームを誘導し、敵プログラムをハックし、救われたくないAIを復元せよ。",
    lookingForTesters: true,
    testerSlots: 10,
    lastUpdated: "2026-06-09",
    section: "testers",
    tags: ["パズル", "テスター募集中"],
    playUrl: "https://logicloop.github.io/pulse-circuit",
    githubUrl: "https://github.com/logicloop/pulse-circuit",
  },
  {
    id: "wolfpack-siege",
    title: "狼群の包囲",
    genre: "協力プレイ",
    status: "テスター募集中",
    creator: "パックタクティクス",
    phase: "α版",
    description:
      "4人協力の包囲防衛。機械化ハンターの波に立ち向かい、トラップを設置し、弾薬を共有し、救出まで防衛線を守れ。",
    lookingForTesters: true,
    testerSlots: 10,
    lastUpdated: "2026-06-06",
    section: "testers",
    tags: ["協力プレイ", "テスター募集中"],
    playUrl: "https://packtactics.itch.io/wolfpack-siege",
    itchUrl: "https://packtactics.itch.io/wolfpack-siege",
    discordUrl: "https://discord.gg/wolfpacksiege",
  },
  {
    id: "aetherborn",
    title: "エーテルボーン",
    genre: "MMORPG",
    status: "β版",
    creator: "エーテリアルワールド",
    phase: "β版",
    description:
      "死にゆく星から魔力を引き出すオープンワールドMMORPG。ギルドに参加し、雲の海を航海し、星座が暗くなる理由を解き明かせ。",
    lookingForTesters: false,
    lastUpdated: "2026-05-30",
    section: "beta",
    tags: ["RPG"],
    playUrl: "https://store.steampowered.com/app/1845120/Aetherborn",
    steamUrl: "https://store.steampowered.com/app/1845120/Aetherborn",
    officialUrl: "https://aetherborn.world",
    discordUrl: "https://discord.gg/aetherborn",
  },
  {
    id: "blade-of-ash",
    title: "灰の刃",
    genre: "アクション",
    status: "β版",
    creator: "シンダーエッジ",
    phase: "β版",
    description:
      "灰を使った戦闘メカニクスを備えた高速侍アクション。敵の炎を消して会心の一撃を開き、鬼に侵された村を切り開け。",
    lookingForTesters: false,
    lastUpdated: "2026-05-25",
    section: "beta",
    tags: ["アクション"],
    playUrl: "https://cinderedge.itch.io/blade-of-ash",
    itchUrl: "https://cinderedge.itch.io/blade-of-ash",
    officialUrl: "https://bladeofash.jp",
  },
  {
    id: "quantum-relay",
    title: "量子リレー",
    genre: "SF",
    status: "β版",
    creator: "フェーズシフト研究所",
    phase: "β版",
    description:
      "量子ゲート越しにボールをテレポートさせるSFスポーツ。リレーチェーンを連携させ、敵ポータルを妨害し、無重力で得点を決めろ。",
    lookingForTesters: false,
    lastUpdated: "2026-06-04",
    section: "beta",
    tags: ["協力プレイ", "短時間"],
    playUrl: "https://phaseshiftlabs.github.io/quantum-relay",
    githubUrl: "https://github.com/phaseshiftlabs/quantum-relay",
  },
  {
    id: "grimhold",
    title: "グリムホールド",
    genre: "サバイバル",
    status: "β版",
    creator: "アイアンルート",
    phase: "β版",
    description:
      "終わりなき冬に包囲された要塞でのハードコアサバイバル。暖を管理し、飢えと士気を維持し、暖かさを求める生物から壁を守れ。",
    lookingForTesters: false,
    lastUpdated: "2026-05-18",
    section: "beta",
    tags: ["RPG"],
    playUrl: "https://drive.google.com/file/d/grimhold-beta-build/view",
    officialUrl: "https://grimhold.survival",
    discordUrl: "https://discord.gg/grimhold",
  },
  {
    id: "lumen-quest",
    title: "ルーメンクエスト",
    genre: "メトロイドヴァニア",
    status: "β版",
    creator: "グローパスゲームズ",
    phase: "β版",
    description:
      "生物発光の植物に照らされた広大な地下王国を探索。光の能力を解放し、忘れられた洞窟を地図に記し、頭上の日食に立ち向かえ。",
    lookingForTesters: false,
    lastUpdated: "2026-05-22",
    section: "beta",
    tags: ["RPG", "アクション"],
    playUrl: "https://glowpath.itch.io/lumen-quest",
    itchUrl: "https://glowpath.itch.io/lumen-quest",
    githubUrl: "https://github.com/glowpath/lumen-quest",
  },
  {
    id: "titans-edge",
    title: "タイタンズエッジ",
    genre: "MOBA",
    status: "β版",
    creator: "コロッサスアリーナ",
    phase: "β版",
    description:
      "歩く巨神の背中で繰り広げるMOBA。移動する巨像の上でレーンを制圧し、コアクリスタルを破壊し、敵の巨獣を倒せ。",
    lookingForTesters: false,
    lastUpdated: "2026-06-01",
    section: "beta",
    tags: ["協力プレイ", "アクション"],
    playUrl: "https://store.steampowered.com/app/990120/Titans_Edge",
    steamUrl: "https://store.steampowered.com/app/990120/Titans_Edge",
    officialUrl: "https://titansedge.moba",
  },
];

for (const game of games) {
  if (isBuiltInThumbnailId(game.id)) {
    game.thumbnailUrl = getBuiltInThumbnailUrl(game.id);
  }
}

export function getGameById(id: string): Game | undefined {
  return games.find((game) => game.id === id);
}

export function getGamesBySection(section: Game["section"]): Game[] {
  return games.filter((game) => game.section === section);
}
