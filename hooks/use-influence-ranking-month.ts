"use client";

import { useEffect, useState } from "react";
import {
  getInfluenceRankingMonth,
  type InfluenceRankingMonth,
} from "@/lib/influence-ranking-v0-mock-data";
import { getInfluenceRankingMonthMeta } from "@/lib/influence-ranking-month-catalog";
import { loadInfluenceRankingMonth } from "@/lib/influence-ranking-loader";
import { shouldHideV0MockContent } from "@/lib/production-mode";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import { buildEmptyInfluenceRankingMonth } from "@/lib/supabase/influence-ranking-db";

function createRankingMonthPlaceholder(monthId: string): InfluenceRankingMonth {
  const meta = getInfluenceRankingMonthMeta(monthId);
  return buildEmptyInfluenceRankingMonth(meta.id, meta.label, meta.period);
}

export function useInfluenceRankingMonth(monthId: string): {
  month: InfluenceRankingMonth;
  loaded: boolean;
  dataSource: "mock" | "live";
} {
  const [month, setMonth] = useState<InfluenceRankingMonth>(() =>
    createRankingMonthPlaceholder(monthId),
  );
  const [loaded, setLoaded] = useState(false);
  const [dataSource, setDataSource] = useState<"mock" | "live">(
    shouldHideV0MockContent() ? "live" : "mock",
  );

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setMonth(createRankingMonthPlaceholder(monthId));

    const supabase = getOptionalSupabaseClient();
    void loadInfluenceRankingMonth(supabase, monthId)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setMonth(result.month);
        setDataSource(result.source);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        if (shouldHideV0MockContent()) {
          setMonth(createRankingMonthPlaceholder(monthId));
          setDataSource("live");
          return;
        }
        setMonth(getInfluenceRankingMonth(monthId));
        setDataSource("mock");
      })
      .finally(() => {
        if (!cancelled) {
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [monthId]);

  return { month, loaded, dataSource };
}
