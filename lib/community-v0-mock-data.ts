export type DevlogQuoteRef = {
  id: string;
  version: string;
  title: string;
  excerpt: string;
};

export type CommunityPost = {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorHandle: string;
  body: string;
  postedAt: string;
  audienceLabel: string;
  devlogQuote?: DevlogQuoteRef;
};

export const developerDevlogQuoteOptions: DevlogQuoteRef[] = [
  {
    id: "dq1",
    version: "v0.4.0",
    title: "チュートリアル短縮と序盤イベント調整",
    excerpt:
      "プレイヤーのフィードバックを反映し、チュートリアルを約30%短くしました。",
  },
  {
    id: "dq2",
    version: "v0.3.2",
    title: "遭遇イベントのテンポ改善",
    excerpt: "戦闘前後のフェードと待ち時間を調整しました。",
  },
  {
    id: "dq3",
    version: "v0.3.0",
    title: "v0.3.0 — 森の奥へ",
    excerpt: "新エリア「記憶の泉」を追加。フィードバックをお待ちしています。",
  },
];

/** 開発者がフォロワーへ送った掲示板投稿 */
export const studioCommunityPostsMock: CommunityPost[] = [
  {
    id: "sp1",
    authorName: "しゃねこ",
    authorAvatar: "/images/landing/game-1.png",
    authorHandle: "shaneco",
    body: "みなさんぜひプレイお願いします！序盤の導線、特に気になる点があれば教えてください。",
    postedAt: "2日前",
    audienceLabel: "フォロワー全員",
    devlogQuote: developerDevlogQuoteOptions[0],
  },
  {
    id: "sp2",
    authorName: "しゃねこ",
    authorAvatar: "/images/landing/game-1.png",
    authorHandle: "shaneco",
    body: "今週末はバグ修正に集中します。再プレイして気づいたことがあれば歓迎です。",
    postedAt: "1週間前",
    audienceLabel: "フォロワー全員",
  },
];

/** プレイヤーが参加している開発者コミュニティの投稿フィード */
export const playerCommunityFeedMock: CommunityPost[] = [
  ...studioCommunityPostsMock,
  {
    id: "pf1",
    authorName: "Sora Games",
    authorAvatar: "/images/landing/game-2.png",
    authorHandle: "soragames",
    body: "新作デモを公開しました。世界観の感想をもらえると嬉しいです。",
    postedAt: "3日前",
    audienceLabel: "参加コミュニティ",
    devlogQuote: {
      id: "dq-sora",
      version: "v0.2.0",
      title: "星灯の旅路 — 第2章追加",
      excerpt: "ランタンの演出を強化し、新しいNPCを2体追加しました。",
    },
  },
  {
    id: "pf2",
    authorName: "GreenSmith",
    authorAvatar: "/images/landing/game-5.png",
    authorHandle: "greensmith",
    body: "癒し系シミュのテスト版です。ゆっくり遊んでフィードバックください。",
    postedAt: "5日前",
    audienceLabel: "参加コミュニティ",
  },
];

export const playerJoinedCommunities = [
  { id: "shaneco", name: "しゃねこ", memberCount: 128, avatar: "/images/landing/game-1.png" },
  { id: "sora-games", name: "Sora Games", memberCount: 2341, avatar: "/images/landing/game-2.png" },
  { id: "greensmith", name: "GreenSmith", memberCount: 1567, avatar: "/images/landing/game-5.png" },
];

export const studioOwnCommunityId = "shaneco";

export const allPlayerCommunities = [
  { id: "shaneco", name: "しゃねこ", avatar: "/images/landing/game-1.png" },
  { id: "sora-games", name: "Sora Games", avatar: "/images/landing/game-2.png" },
  { id: "lunaworks", name: "LunaWorks", avatar: "/images/landing/game-3.png" },
  { id: "greensmith", name: "GreenSmith", avatar: "/images/landing/game-5.png" },
];
