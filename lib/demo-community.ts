import { getBuiltInDemoActivity, isBuiltInMockGame } from "@/lib/demo-activity";

export type DemoCommunityHighlight = {
  stars: number;
  text: string;
};

export type DemoCommunityComment = {
  id: string;
  text: string;
  funRating: number;
  date: string;
};

export type DemoCommunityData = {
  communityHighlights: DemoCommunityHighlight[];
  communityComments: DemoCommunityComment[];
  averageRatings: {
    fun: number;
    controls: number;
    replay: number;
  };
  feedbackHighlights: string[];
};

const DEMO_COMMUNITY: Record<string, DemoCommunityData> = {
  emberfall: {
    communityHighlights: [
      { stars: 5, text: "面白いボス戦" },
      { stars: 4, text: "テンポが良い" },
      { stars: 4, text: "世界観に引き込まれる" },
    ],
    communityComments: [
      {
        id: "emberfall-c1",
        text: "ボス戦の手応えが素晴らしい。回避のタイミングが気持ちいいです。",
        funRating: 5,
        date: "2026-06-09",
      },
      {
        id: "emberfall-c2",
        text: "序盤のチュートリアルがもう少し欲しいけど、探索はかなり楽しい。",
        funRating: 4,
        date: "2026-06-05",
      },
    ],
    averageRatings: { fun: 4.4, controls: 4.1, replay: 4.3 },
    feedbackHighlights: ["UI改善", "難易度調整", "チュートリアル追加"],
  },
  "rift-runner": {
    communityHighlights: [
      { stars: 5, text: "次元切り替えが爽快" },
      { stars: 4, text: "テンポが良い" },
      { stars: 4, text: "操作の学習曲線がちょうどいい" },
    ],
    communityComments: [
      {
        id: "rift-c1",
        text: "次元ジャンプのタイミングが気持ちよくて、何度もリトライしたくなる。",
        funRating: 5,
        date: "2026-06-07",
      },
      {
        id: "rift-c2",
        text: "後半ステージの難易度が上がるのが良い。説明UIはもう少し欲しい。",
        funRating: 4,
        date: "2026-06-03",
      },
    ],
    averageRatings: { fun: 4.5, controls: 3.9, replay: 4.6 },
    feedbackHighlights: ["操作説明の改善", "難易度調整", "UI改善"],
  },
  "wolfpack-siege": {
    communityHighlights: [
      { stars: 5, text: "友達と遊ぶと楽しい" },
      { stars: 4, text: "協力プレイが熱い" },
      { stars: 4, text: "防衛の緊張感が良い" },
    ],
    communityComments: [
      {
        id: "wolf-c1",
        text: "4人で初クリアしたときの達成感がすごい。ボイスなしでも連携できる。",
        funRating: 5,
        date: "2026-06-05",
      },
    ],
    averageRatings: { fun: 4.6, controls: 4.2, replay: 4.8 },
    feedbackHighlights: ["協力プレイの同期改善", "難易度調整"],
  },
  "pulse-circuit": {
    communityHighlights: [
      { stars: 4, text: "パズルのひらめきが気持ちいい" },
      { stars: 4, text: "テンポが良い" },
      { stars: 5, text: "短時間で遊べる" },
    ],
    communityComments: [
      {
        id: "pulse-c1",
        text: "回路パズルが独特でハマった。ヒントUIの追加が助かった。",
        funRating: 4,
        date: "2026-06-08",
      },
    ],
    averageRatings: { fun: 4.2, controls: 4.5, replay: 4.0 },
    feedbackHighlights: ["ヒントUI追加", "UI改善"],
  },
  aetherborn: {
    communityHighlights: [
      { stars: 5, text: "世界観が広がる" },
      { stars: 4, text: "探索が楽しい" },
      { stars: 4, text: "ギルド要素が良い" },
    ],
    communityComments: [
      {
        id: "aether-c1",
        text: "雲の海を航海する感覚が新しい。β版でも十分遊べるボリューム。",
        funRating: 5,
        date: "2026-05-29",
      },
    ],
    averageRatings: { fun: 4.3, controls: 3.8, replay: 4.5 },
    feedbackHighlights: ["序盤の成長曲線", "ギルドクエスト"],
  },
};

const DEFAULT_HIGHLIGHTS: DemoCommunityHighlight[] = [
  { stars: 4, text: "テンポが良い" },
  { stars: 4, text: "もっと遊びたい" },
  { stars: 5, text: "世界観が良い" },
];

const DEFAULT_COMMENTS: DemoCommunityComment[] = [
  {
    id: "default-c1",
    text: "プロトタイプながら完成度が高く、プレイ後に伝えたいことがはっきりしている。",
    funRating: 4,
    date: "2026-06-04",
  },
];

function buildDefaultCommunity(gameId: string): DemoCommunityData {
  return {
    communityHighlights: DEFAULT_HIGHLIGHTS,
    communityComments: DEFAULT_COMMENTS.map((comment) => ({
      ...comment,
      id: `${gameId}-${comment.id}`,
    })),
    averageRatings: { fun: 4.1, controls: 3.9, replay: 4.2 },
    feedbackHighlights: ["UI改善", "難易度調整"],
  };
}

export function getDemoCommunityData(gameId: string): DemoCommunityData | null {
  if (!isBuiltInMockGame(gameId)) {
    return null;
  }

  return DEMO_COMMUNITY[gameId] ?? buildDefaultCommunity(gameId);
}

export function formatStars(rating: number): string {
  const rounded = Math.max(1, Math.min(5, Math.round(rating)));
  return `${"★".repeat(rounded)}${"☆".repeat(5 - rounded)}`;
}

export type DevelopmentActivityMetrics = {
  updateFrequency: string;
  recentImprovement: string;
  devActivityCount: number;
  adoptedSuggestionsCount: number;
};

function deriveUpdateFrequency(devlogCount: number): string {
  if (devlogCount >= 3) {
    return "週1〜2回";
  }

  if (devlogCount >= 2) {
    return "月2〜3回";
  }

  return "不定期";
}

export function getDevelopmentActivityMetrics(
  gameId: string,
): DevelopmentActivityMetrics | null {
  const activity = getBuiltInDemoActivity(gameId);

  if (!activity) {
    return null;
  }

  const recentImprovement =
    activity.recentEvents.find(
      (event) => event.type === "update" || event.type === "feedback_applied",
    )?.label ??
    activity.recentEvents.find((event) => event.type === "launch")?.label ??
    "—";

  return {
    updateFrequency: deriveUpdateFrequency(activity.devlogCount),
    recentImprovement,
    devActivityCount: activity.devlogCount,
    adoptedSuggestionsCount: activity.feedbackAppliedCount,
  };
}
