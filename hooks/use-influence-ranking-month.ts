"use client";

import { useEffect, useState } from "react";
import {
  getInfluenceRankingMonth,
  type InfluenceRankingMonth,
} from "@/lib/influence-ranking-v0-mock-data";
import { loadInfluenceRankingMonth } from "@/lib/influence-ranking-loader";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";

export function useInfluenceRankingMonth(monthId: string): {
  month: InfluenceRankingMonth;
  loaded: boolean;
  dataSource: "mock" | "live";
} {
  const mockMonth = getInfluenceRankingMonth(monthId);
  const [month, setMonth] = useState<InfluenceRankingMonth>(mockMonth);
  const [loaded, setLoaded] = useState(false);
  const [dataSource, setDataSource] = useState<"mock" | "live">("mock");

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setMonth(getInfluenceRankingMonth(monthId));

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
        if (!cancelled) {
          setMonth(mockMonth);
          setDataSource("mock");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [monthId, mockMonth]);

  return { month, loaded, dataSource };
}
