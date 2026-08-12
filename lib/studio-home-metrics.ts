export type StudioHomePlayDepthPoint = {
  once: number;
  twice: number;
  thricePlus: number;
  total: number;
};

export type StudioHomeVoiceFunnelPoint = {
  played: number;
  voiced: number;
  deep: number;
};

export type StudioHomeWitnessCommunityPoint = {
  /** project_watches ベース（project_witness_grants は未使用） */
  watching: number;
  communityMembers: number;
};

export type StudioHomeConnectionMetrics = {
  months: string[];
  playDepth: StudioHomePlayDepthPoint[];
  voiceFunnel: StudioHomeVoiceFunnelPoint[];
  witnessCommunity: StudioHomeWitnessCommunityPoint[];
};

export type StudioHomeHighlights = {
  unreadVoiceProjectCount: number;
  hasRecentCommunityReply: boolean;
};

export const STUDIO_HOME_METRICS_MONTH_COUNT = 6;

export type StudioHomeGranularity = "day" | "week" | "month";

export const STUDIO_HOME_GRANULARITY_OPTIONS: {
  id: StudioHomeGranularity;
  label: string;
}[] = [
  { id: "day", label: "日次（直近6日間）" },
  { id: "week", label: "週次（直近6週間）" },
  { id: "month", label: "月次（直近6か月）" },
];

export function isStudioHomeGranularity(value: string): value is StudioHomeGranularity {
  return value === "day" || value === "week" || value === "month";
}

export const EMPTY_STUDIO_HOME_CONNECTION_METRICS: StudioHomeConnectionMetrics = {
  months: [],
  playDepth: [],
  voiceFunnel: [],
  witnessCommunity: [],
};

export function formatStudioHomeMonthLabel(monthKey: string): string {
  const [, month] = monthKey.split("-");
  const monthNumber = Number.parseInt(month ?? "", 10);
  if (!Number.isFinite(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    return monthKey;
  }
  return `${monthNumber}月`;
}

export function formatStudioHomePeriodChartLabel(
  periodKey: string,
  granularity: StudioHomeGranularity,
): string {
  if (granularity === "month") {
    return formatStudioHomeMonthLabel(periodKey);
  }
  const parts = periodKey.split("-");
  const month = Number.parseInt(parts[1] ?? "", 10);
  const day = Number.parseInt(parts[2] ?? "", 10);
  if (!Number.isFinite(month) || !Number.isFinite(day)) {
    return periodKey;
  }
  if (granularity === "day") {
    return `${month}/${day}`;
  }
  return `${month}/${day}週`;
}

export function formatStudioHomePeriodFooterLabel(
  periodKey: string,
  granularity: StudioHomeGranularity,
  kind: "breakdown" | "current" | "witness",
): string {
  const chartLabel = formatStudioHomePeriodChartLabel(periodKey, granularity);
  if (kind === "witness") {
    if (granularity === "day") {
      return "今日の現在値";
    }
    if (granularity === "week") {
      return "今週末時点";
    }
    return `${chartLabel}末時点`;
  }
  if (kind === "current") {
    if (granularity === "day") {
      return "今日の現在値";
    }
    if (granularity === "week") {
      return "今週の現在値";
    }
    return `${chartLabel}の現在値`;
  }
  if (granularity === "day") {
    return "今日の内訳";
  }
  if (granularity === "week") {
    return "今週の内訳";
  }
  return `${chartLabel}の内訳`;
}

export function hasStudioHomeConnectionData(metrics: StudioHomeConnectionMetrics): boolean {
  const hasPlay = metrics.playDepth.some((point) => point.total > 0);
  const hasVoice = metrics.voiceFunnel.some(
    (point) => point.played > 0 || point.voiced > 0 || point.deep > 0,
  );
  const hasWitness = metrics.witnessCommunity.some(
    (point) => point.watching > 0 || point.communityMembers > 0,
  );
  return hasPlay || hasVoice || hasWitness;
}

/** RPC 適用済みで月次系列が返ればグラフを描画する（全月0でも API 値をそのまま表示） */
export function shouldRenderStudioHomeCharts(
  metrics: StudioHomeConnectionMetrics,
  rpcReady: boolean,
): boolean {
  return rpcReady && metrics.months.length > 0;
}

export function isWitnessSpreadEmpty(metrics: StudioHomeConnectionMetrics): boolean {
  return !metrics.witnessCommunity.some(
    (point) => point.watching > 0 || point.communityMembers > 0,
  );
}

export function latestStudioHomePlayDepth(
  metrics: StudioHomeConnectionMetrics,
): StudioHomePlayDepthPoint {
  return (
    metrics.playDepth[metrics.playDepth.length - 1] ?? {
      once: 0,
      twice: 0,
      thricePlus: 0,
      total: 0,
    }
  );
}

export function latestStudioHomeVoiceFunnel(
  metrics: StudioHomeConnectionMetrics,
): StudioHomeVoiceFunnelPoint {
  return (
    metrics.voiceFunnel[metrics.voiceFunnel.length - 1] ?? {
      played: 0,
      voiced: 0,
      deep: 0,
    }
  );
}

export function latestStudioHomeWitnessCommunity(
  metrics: StudioHomeConnectionMetrics,
): StudioHomeWitnessCommunityPoint {
  return (
    metrics.witnessCommunity[metrics.witnessCommunity.length - 1] ?? {
      watching: 0,
      communityMembers: 0,
    }
  );
}

export function voiceDeliveryRatePercent(voiced: number, played: number): number | null {
  if (played <= 0) {
    return null;
  }
  return Math.round((voiced / played) * 100);
}

export const STUDIO_HOME_DEV_HINTS = [
  {
    id: "voice-prompts",
    title: "フィードバックが届きやすい問いの作り方",
    href: "/studio/guide#voice-prompts",
    tips: [
      "今のverで一番知りたいことを1つに絞る",
      "選択肢は短く、試した直後に答えやすい形にする",
      "問いの意図を作品ページか開発ログに一言添える",
    ],
    lead: "問いは、アンケートではなく「いま聞きたいこと」の短い依頼です。",
    paragraphs: [
      "試した直後に答えられる粒度にすると、初回フィードバックのハードルが下がります。",
      "バージョンごとに問いを変えると、「今回は何を見てほしいか」が伝わります。",
    ],
  },
  {
    id: "devlog-tips",
    title: "開発ログで伝えると効果的なこと",
    href: "/studio/guide#devlog-tips",
    tips: [
      "今回のverで試したいことを先に書く",
      "変えた理由を短く説明する",
      "所要時間の目安を添える",
    ],
    lead: "開発ログは宣伝ではなく、更新の意図と確認依頼を伝える場所です。",
    paragraphs: [
      "何を直したかだけでなく、なぜ直したかがあると見届け人が変化を追いやすくなります。",
      "短い開発ログでも、問いとのセットで届けるとフィードバックの質が上がりやすいです。",
    ],
  },
  {
    id: "low-response-review",
    title: "反応が少ないときの見直しポイント",
    href: "/studio/guide#low-response-review",
    tips: [
      "サムネとタイトルで内容が伝わるか",
      "試したあとに何をしてほしいかが見えるか",
      "初めて試すときの所要時間が長すぎないか",
    ],
    lead: "反応が少ないときは、まず「試されたか」「フィードバックを送る理由があるか」を見直します。",
    paragraphs: [
      "作品ページで今のverの意図が伝わっているかを確認してください。",
      "問いが多すぎる・抽象的すぎる場合は、1つに絞るだけでも変わることがあります。",
    ],
  },
] as const;

export const STUDIO_HOME_QUICK_LINKS = [
  { label: "作品一覧", href: "/studio/mypage" },
  { label: "新規投稿", href: "/studio/submit" },
  { label: "メッセージ", href: "/studio/messages" },
  { label: "フィードバックを確認", href: "/studio/mypage" },
] as const;
