import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getInfluenceRankingMonth,
  influenceRankingMonths,
  type InfluenceRankingMonth,
} from "@/lib/influence-ranking-v0-mock-data";
import {
  buildInfluenceMonthFromEntries,
  fetchMonthlyPlayerInfluenceRanking,
} from "@/lib/supabase/influence-ranking-db";

export async function loadInfluenceRankingMonth(
  supabase: SupabaseClient | null,
  monthId: string,
): Promise<{ month: InfluenceRankingMonth; source: "mock" | "live" }> {
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
