import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchStudioHomeConnectionMetrics } from "@/lib/supabase/studio-home-metrics-db";

export const runtime = "nodejs";

export async function GET() {
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
    const { metrics, rpcReady } = await fetchStudioHomeConnectionMetrics(supabase);
    return NextResponse.json({ metrics, rpcReady });
  } catch (error) {
    console.error("studio home metrics failed", error);
    return NextResponse.json({ error: "Failed to load metrics" }, { status: 500 });
  }
}
