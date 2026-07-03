import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchStudioHomeConnectionMetrics } from "@/lib/supabase/studio-home-metrics-db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const granularityParam = request.nextUrl.searchParams.get("granularity") ?? "month";
    const granularity = (
      granularityParam === "day" || granularityParam === "week" || granularityParam === "month"
        ? granularityParam
        : "month"
    ) as "day" | "week" | "month";

    const { metrics, rpcReady, granularityFallback } =
      await fetchStudioHomeConnectionMetrics(supabase, granularity);
    return NextResponse.json(
      { metrics, rpcReady, granularity, granularityFallback },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("studio home metrics failed", error);
    return NextResponse.json({ error: "Failed to load metrics" }, { status: 500 });
  }
}
