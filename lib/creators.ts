export type Creator = {
  id: string;
  name: string;
  profile: string;
  xAccount?: string;
  website?: string;
};

export const creatorProfiles: Creator[] = [
  {
    id: "ashforge-studio",
    name: "灰鉄スタジオ",
    profile:
      "ダークファンタジーを専門とするインディースタジオ。重厚な世界観と剣戟アクションの融合を追求しています。",
  },
  {
    id: "pulse-lane-games",
    name: "パルスレーンゲームズ",
    profile:
      "ネオンとスピードが信条のレースゲーム開発チーム。短時間で遊べるアーケード体験を大切にしています。",
  },
  {
    id: "static-room-collective",
    name: "静電室コレクティブ",
    profile:
      "音と恐怖をテーマにした実験的ホラーゲームを制作。ラジオ、記録媒体、静寂を使った体験設計が得意です。",
  },
  {
    id: "orbital-mind",
    name: "オービタルマインド",
    profile:
      "宇宙規模のストラテジーとシミュレーションを手がける小さなチーム。戦術の深さと読みやすいUIを両立させます。",
  },
  {
    id: "frontline-forge",
    name: "最前線フォージ",
    profile:
      "タクティカルシューターと軍事SFが中心。小隊指揮と近未来兵器の組み合わせを研究しています。",
  },
  {
    id: "canopy-labs",
    name: "キャノピーラボ",
    profile:
      "自然とパズルを組み合わせた穏やかな探索ゲームを開発。手描きアートと環境演出にこだわっています。",
  },
  {
    id: "jumpcut",
    name: "ジャンプカット",
    profile:
      "高速プラットフォームゲームのスペシャリスト。操作の気持ちよさと創意工夫のあるステージ設計が目標です。",
  },
  {
    id: "deep-red-games",
    name: "ディープレッドゲームズ",
    profile:
      "ローグライクとダンジョン探索の境界を攻めるスタジオ。高リスク・高リターンのゲームプレイが特徴です。",
  },
  {
    id: "cloudstrike-dev",
    name: "雲撃開発室",
    profile:
      "格闘ゲームと空中バトルの融合を目指す開発室。コンボの爽快感と視認性の高い演出を重視します。",
  },
  {
    id: "silent-trail",
    name: "サイレントトレイル",
    profile:
      "ステルスとサウンドデザインを軸にしたインディー開発者グループ。音を読むプレイ体験を探求しています。",
  },
  {
    id: "logic-loop",
    name: "ロジックループ",
    profile:
      "パズルとシステム設計が好きな開発チーム。回路、データ、論理パズルをゲームに落とし込むことを得意とします。",
  },
  {
    id: "pack-tactics",
    name: "パックタクティクス",
    profile:
      "協力プレイと防衛ゲームを専門とするスタジオ。仲間との連携が勝利の鍵になる体験を作り続けています。",
  },
  {
    id: "ethereal-worlds",
    name: "エーテリアルワールド",
    profile:
      "大規模オンライン世界の構築に取り組むチーム。探索、ギルド、星々の物語を通じた長期プレイを目指します。",
  },
  {
    id: "cinder-edge",
    name: "シンダーエッジ",
    profile:
      "和風アクションと高速Combatを融合させる開発者。灰と炎をテーマにした独自のバトルシステムを研究しています。",
  },
  {
    id: "phase-shift-labs",
    name: "フェーズシフト研究所",
    profile:
      "SFスポーツと物理パズルの実験室。テレポート、無重力、チーム連携を組み合わせた新しい競技体験を開発中です。",
  },
  {
    id: "ironroot",
    name: "アイアンルート",
    profile:
      "サバイバルと拠点防衛のハードコアなゲームを制作。資源管理と緊張感のある夜の防衛が魅力です。",
  },
  {
    id: "glowpath-games",
    name: "グローパスゲームズ",
    profile:
      "探索型アクションアドベンチャーの開発スタジオ。光、地下世界、能力解放を軸にしたマップ設計が得意です。",
  },
  {
    id: "colossus-arena",
    name: "コロッサスアリーナ",
    profile:
      "大規模対戦ゲームと独創的な舞台設定を組み合わせるチーム。巨大な存在の上で繰り広げる戦いを追求しています。",
  },
];

export function getCreatorId(name: string): string {
  return creatorProfiles.find((creator) => creator.name === name)?.id ?? encodeURIComponent(name);
}

export function getCreatorById(id: string): Creator {
  const profile = creatorProfiles.find((creator) => creator.id === id);
  if (profile) {
    return profile;
  }

  let name = id;
  try {
    name = decodeURIComponent(id);
  } catch {
    name = id;
  }

  return {
    id,
    name,
    profile: `${name}はForgeでゲーム開発を続けています。`,
  };
}

export function getCreatorByName(name: string): Creator {
  return getCreatorById(getCreatorId(name));
}
