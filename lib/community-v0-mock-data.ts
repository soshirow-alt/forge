import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import type { ConfirmationRequestQuoteRef } from "@/lib/community-types";

export type DevlogQuoteRef = {
  id: string;
  /** 引用先の作品 ID（ゲーム詳細へ遷移） */
  gameId: string;
  version: string;
  title: string;
  excerpt: string;
  image?: string;
  publishedAt?: string;
  likeCount?: number;
  commentCount?: number;
};

export type CommunityReply = {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorHandle: string;
  body: string;
  postedAt: string;
};

export type CommunityPost = {
  id: string;
  communityId: string;
  authorRole: "developer" | "player";
  authorName: string;
  authorAvatar: string;
  authorHandle: string;
  body: string;
  postedAt: string;
  audienceLabel: string;
  devlogQuote?: DevlogQuoteRef;
  confirmationQuote?: ConfirmationRequestQuoteRef;
  replies?: CommunityReply[];
};

const SHANECO_GAME_ID = "seikat-no-tabiji";

export function devlogQuoteHref(quote: DevlogQuoteRef): string {
  return `${gameDetailHref(quote.gameId)}?tab=devlog`;
}

export const developerDevlogQuoteOptions: DevlogQuoteRef[] = [
  {
    id: "dq1",
    gameId: SHANECO_GAME_ID,
    version: "v0.3",
    title: "バトル調整と新敵追加",
    excerpt: "バトルテンポを改善し、新しい敵キャラクターを2体追加しました。",
    image: "/images/landing/hero-bg.png",
    publishedAt: "2025/06/15",
    likeCount: 12,
    commentCount: 8,
  },
  {
    id: "dq2",
    gameId: SHANECO_GAME_ID,
    version: "v0.2",
    title: "UI刷新とチュートリアル改善",
    excerpt: "UIを整理し、チュートリアルの導線を短くしました。",
    image: "/images/landing/game-2.png",
    publishedAt: "2025/06/01",
    likeCount: 9,
    commentCount: 5,
  },
  {
    id: "dq3",
    gameId: SHANECO_GAME_ID,
    version: "v0.3.0",
    title: "v0.3.0 — 森の奥へ",
    excerpt: "新エリア「記憶の泉」を追加。フィードバックをお待ちしています。",
    image: "/images/landing/game-3.png",
    publishedAt: "2025/05/20",
    likeCount: 6,
    commentCount: 3,
  },
];

export const studioCommunityProfile = {
  id: "shaneco",
  name: "しゃねこコミュニティ",
  avatar: "/images/landing/game-1.png",
  handle: "shaneco_dev",
  description: "フォロワーと交流し、一緒にゲームを育てましょう",
  /** v0 表示用（mock 正本） */
  memberCountLabel: 128,
};

/** 開発者がフォロワーへ送った掲示板投稿 */
export const studioCommunityPostsMock: CommunityPost[] = [
  {
    id: "sp1",
    communityId: "shaneco",
    authorRole: "developer",
    authorName: "しゃねこ",
    authorAvatar: "/images/landing/game-1.png",
    authorHandle: "shaneco_dev",
    body: "みなさんぜひプレイお願いします！序盤の導線、特に気になる点があれば教えてください。",
    postedAt: "2時間前",
    audienceLabel: "コミュニティ全員",
    devlogQuote: developerDevlogQuoteOptions[0],
    confirmationQuote: {
      id: "cq-mock-1",
      confirmationRequestId: "mock-confirmation-1",
      devlogId: "mock-devlog-1",
      gameId: SHANECO_GAME_ID,
      version: "v0.3.1",
      title: "バトル調整と新敵追加",
      changesSummary: "ボス戦の難易度を調整しました",
      askSummary: "前より理不尽に感じないか確認してほしい",
      estimatedDuration: "5分",
      linkedPriorityTitles: ["ボス戦が理不尽に感じる"],
      publishedAt: "2025/06/15",
    },
    replies: [
      {
        id: "rp1",
        authorName: "そら",
        authorAvatar: "/images/landing/game-2.png",
        authorHandle: "sora_player",
        body: "序盤のチュートリアル、とても分かりやすかったです！",
        postedAt: "1時間前",
      },
    ],
  },
  {
    id: "sp2",
    communityId: "shaneco",
    authorRole: "developer",
    authorName: "しゃねこ",
    authorAvatar: "/images/landing/game-1.png",
    authorHandle: "shaneco_dev",
    body: "今週末はバグ修正に集中します。再プレイして気づいたことがあれば歓迎です。",
    postedAt: "1週間前",
    audienceLabel: "コミュニティ全員",
  },
];

/** プレイヤーが参加している開発者コミュニティの投稿フィード */
export const playerCommunityFeedMock: CommunityPost[] = [
  ...studioCommunityPostsMock,
  {
    id: "pf1",
    communityId: "sora-games",
    authorRole: "developer",
    authorName: "Sora Games",
    authorAvatar: "/images/landing/game-2.png",
    authorHandle: "soragames",
    body: "新作デモを公開しました。世界観の感想をもらえると嬉しいです。",
    postedAt: "3日前",
    audienceLabel: "参加コミュニティ",
    devlogQuote: {
      id: "dq-sora",
      gameId: "sorashima-pioneer",
      version: "v0.2.0",
      title: "星灯の旅路 — 第2章追加",
      excerpt: "ランタンの演出を強化し、新しいNPCを2体追加しました。",
    },
  },
  {
    id: "pf2",
    communityId: "greensmith",
    authorRole: "developer",
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
