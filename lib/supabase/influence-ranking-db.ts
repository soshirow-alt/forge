import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  InfluenceRankingEntry,
  InfluenceRankingMetrics,
  InfluenceRankingMonth,
} from "@/lib/influence-ranking-v0-mock-data";
import { RANKING_MAX } from "@/lib/ranking-v0-shared";
import { defaultPublicAvatarSrc } from "@/lib/public-profile-display";

type InfluenceRankingRow = {
  user_id: string;
  display_name: string;
  player_handle: string;
  influence_score: number;
  dev_eval_count: number;
  improvement_linked_count: number;
  verification_contribution_count: number;
  continued_witness_count: number;
  low_voice_contribution_count: number;
};

const TITLES: { title: string; titleColor: string }[] = [
  { title: "未来を動かした人", titleColor: "text-amber-300" },
  { title: "鋭い観察者", titleColor: "text-zinc-300" },
  { title: "新人育て屋", titleColor: "text-orange-300" },
  { title: "バランス調整役", titleColor: "text-violet-300" },
  { title: "誠実な助言者", titleColor: "text-emerald-300" },
  { title: "継続の見届け人", titleColor: "text-sky-300" },
];

export function isInfluenceRankingRpcMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : String(error);

  return (
    message.includes("get_monthly_player_influence_ranking") &&
    (message.includes("does not exist") || message.includes("Could not find"))
  );
}

export function parseInfluenceMonthId(monthId: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(monthId);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}

function rowToMetrics(row: InfluenceRankingRow): InfluenceRankingMetrics {
  return {
    devEvalCount: row.dev_eval_count,
    improvementLinkedCount: row.improvement_linked_count,
    verificationContributionCount: row.verification_contribution_count,
    continuedWitnessCount: row.continued_witness_count,
    lowVoiceContributionCount: row.low_voice_contribution_count,
  };
}

function rowToEntry(row: InfluenceRankingRow, rank: number): InfluenceRankingEntry {
  const title = TITLES[(rank - 1) % TITLES.length]!;
  return {
    rank,
    name: row.display_name,
    handle: row.player_handle,
    avatar: defaultPublicAvatarSrc(row.user_id),
    score: row.influence_score,
    title: title.title,
    titleColor: title.titleColor,
    metrics: rowToMetrics(row),
  };
}

export async function fetchMonthlyPlayerInfluenceRanking(
  supabase: SupabaseClient,
  monthId: string,
): Promise<InfluenceRankingEntry[] | null> {
  const parsed = parseInfluenceMonthId(monthId);
  if (!parsed) {
    return null;
  }

  const { data, error } = await supabase.rpc("get_monthly_player_influence_ranking", {
    p_year: parsed.year,
    p_month: parsed.month,
    p_limit: RANKING_MAX,
  });

  if (error) {
    if (isInfluenceRankingRpcMissingError(error)) {
      return null;
    }
    throw error;
  }

  const rows = (data ?? []) as InfluenceRankingRow[];
  if (rows.length === 0) {
    return [];
  }

  return rows.map((row, index) => rowToEntry(row, index + 1));
}

export function buildInfluenceMonthFromEntries(
  monthId: string,
  label: string,
  period: string,
  entries: InfluenceRankingEntry[],
  lastMonthTop3: InfluenceRankingMonth["lastMonthTop3"],
): InfluenceRankingMonth {
  return {
    id: monthId,
    label,
    period,
    top3: entries.slice(0, 3),
    list: entries.slice(3),
    lastMonthTop3,
  };
}

export function buildInfluenceLastMonthTop3(
  entries: InfluenceRankingEntry[],
): InfluenceRankingMonth["lastMonthTop3"] {
  return entries.slice(0, 3).map((entry) => ({
    rank: entry.rank,
    name: entry.name,
    score: entry.score,
  }));
}

export function buildEmptyInfluenceRankingMonth(
  monthId: string,
  label: string,
  period: string,
  lastMonthTop3: InfluenceRankingMonth["lastMonthTop3"] = [],
): InfluenceRankingMonth {
  return {
    id: monthId,
    label,
    period,
    top3: [],
    list: [],
    lastMonthTop3,
  };
}
