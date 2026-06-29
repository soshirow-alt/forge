import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getInfluenceRankingMonth,
  influenceRankingMonths,
  type InfluenceRankingMonth,
} from "@/lib/influence-ranking-v0-mock-data";
import {
  getInfluenceRankingMonthMeta,
  getPreviousInfluenceRankingMonthId,
} from "@/lib/influence-ranking-month-catalog";
import { shouldHideV0MockContent } from "@/lib/production-mode";
import {
  buildEmptyInfluenceRankingMonth,
  buildInfluenceLastMonthTop3,
  buildInfluenceMonthFromEntries,
  fetchMonthlyPlayerInfluenceRanking,
} from "@/lib/supabase/influence-ranking-db";

async function loadLastMonthTop3(
  supabase: SupabaseClient,
  monthId: string,
): Promise<InfluenceRankingMonth["lastMonthTop3"]> {
  const previousId = getPreviousInfluenceRankingMonthId(monthId);
  if (!previousId) {
    return [];
  }

  const previousEntries = await fetchMonthlyPlayerInfluenceRanking(supabase, previousId);
  if (!previousEntries || previousEntries.length === 0) {
    return [];
  }

  return buildInfluenceLastMonthTop3(previousEntries);
}

export async function loadInfluenceRankingMonth(
  supabase: SupabaseClient | null,
  monthId: string,
): Promise<{ month: InfluenceRankingMonth; source: "mock" | "live" }> {
  const useProductionData = shouldHideV0MockContent();
  const meta = getInfluenceRankingMonthMeta(monthId);

  if (useProductionData) {
    if (!supabase) {
      return {
        month: buildEmptyInfluenceRankingMonth(meta.id, meta.label, meta.period),
        source: "live",
      };
    }

    try {
      const entries = await fetchMonthlyPlayerInfluenceRanking(supabase, monthId);
      const lastMonthTop3 = await loadLastMonthTop3(supabase, monthId);

      if (entries === null) {
        return {
          month: buildEmptyInfluenceRankingMonth(meta.id, meta.label, meta.period, lastMonthTop3),
          source: "live",
        };
      }

      return {
        month: buildInfluenceMonthFromEntries(
          meta.id,
          meta.label,
          meta.period,
          entries,
          lastMonthTop3,
        ),
        source: "live",
      };
    } catch {
      return {
        month: buildEmptyInfluenceRankingMonth(meta.id, meta.label, meta.period),
        source: "live",
      };
    }
  }

  const mockMonth = getInfluenceRankingMonth(monthId);

  if (!supabase) {
    return { month: mockMonth, source: "mock" };
  }

  try {
    const entries = await fetchMonthlyPlayerInfluenceRanking(supabase, monthId);
    if (entries === null || entries.length === 0) {
      return { month: mockMonth, source: "mock" };
    }

    return {
      month: buildInfluenceMonthFromEntries(
        mockMonth.id,
        mockMonth.label,
        mockMonth.period,
        entries,
        mockMonth.lastMonthTop3,
      ),
      source: "live",
    };
  } catch {
    return { month: mockMonth, source: "mock" };
  }
}

export { influenceRankingMonths };
