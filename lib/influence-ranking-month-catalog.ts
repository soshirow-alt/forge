import { parseInfluenceMonthId } from "@/lib/supabase/influence-ranking-db";

/** First month Forge influence ranking is offered (UTC calendar). */
const RANKING_EPOCH = { year: 2026, month: 1 } as const;

export type InfluenceRankingMonthMeta = {
  id: string;
  label: string;
  period: string;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function getCurrentInfluenceRankingMonthId(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${pad2(now.getUTCMonth() + 1)}`;
}

export function getInfluenceRankingMonthMeta(monthId: string): InfluenceRankingMonthMeta {
  const parsed = parseInfluenceMonthId(monthId) ?? parseInfluenceMonthId(getCurrentInfluenceRankingMonthId())!;
  const { year, month } = parsed;
  const id = `${year}-${pad2(month)}`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    id,
    label: `${year}年${month}月`,
    period: `集計期間: ${year}/${pad2(month)}/01 – ${year}/${pad2(month)}/${pad2(lastDay)}`,
  };
}

export function getInfluenceRankingMonthOptions(): InfluenceRankingMonthMeta[] {
  const current = parseInfluenceMonthId(getCurrentInfluenceRankingMonthId())!;
  const options: InfluenceRankingMonthMeta[] = [];
  let year = current.year;
  let month = current.month;

  while (year > RANKING_EPOCH.year || (year === RANKING_EPOCH.year && month >= RANKING_EPOCH.month)) {
    options.push(getInfluenceRankingMonthMeta(`${year}-${pad2(month)}`));
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
  }

  return options;
}

export function getPreviousInfluenceRankingMonthId(monthId: string): string | null {
  const parsed = parseInfluenceMonthId(monthId);
  if (!parsed) {
    return null;
  }

  let { year, month } = parsed;
  month -= 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }

  if (year < RANKING_EPOCH.year || (year === RANKING_EPOCH.year && month < RANKING_EPOCH.month)) {
    return null;
  }

  return `${year}-${pad2(month)}`;
}

export function parseInfluenceRankingMonthId(param: string | null): string {
  if (param && parseInfluenceMonthId(param)) {
    return param;
  }
  return getCurrentInfluenceRankingMonthId();
}
