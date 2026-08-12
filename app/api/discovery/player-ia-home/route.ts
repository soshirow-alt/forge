import { NextResponse } from "next/server";
import { shouldServePlayerIaRedesign } from "@/lib/player-ia-mode";
import { loadPlayerIaHomeDetailed } from "@/lib/player-ia/load-player-ia-home";
import { createAnonSupabaseClient } from "@/lib/supabase/anon-client";

export const runtime = "nodejs";

function serverTimingHeader(
  timing: {
    feedbackRpcMs: number;
    otherShelvesMs: number;
    fillMs: number;
    totalMs: number;
  } | undefined,
  cacheHit: boolean | undefined,
): string | null {
  const parts: string[] = [];
  if (cacheHit) {
    parts.push("cache;desc=\"hit\";dur=0");
  }
  if (timing) {
    parts.push(`fb;desc=\"feedback-rpc\";dur=${timing.feedbackRpcMs}`);
    parts.push(`other;desc=\"other-shelves\";dur=${timing.otherShelvesMs}`);
    parts.push(`fill;desc=\"fb-fill\";dur=${timing.fillMs}`);
    parts.push(`total;desc=\"home-load\";dur=${timing.totalMs}`);
  }
  return parts.length > 0 ? parts.join(", ") : null;
}

export async function GET() {
  if (!shouldServePlayerIaRedesign()) {
    return new NextResponse(null, { status: 404 });
  }

  if (!createAnonSupabaseClient()) {
    return NextResponse.json(
      { ok: false, message: "サービスが準備中です。" },
      { status: 503 },
    );
  }

  const { home, timing, cacheHit } = await loadPlayerIaHomeDetailed();
  if (!home) {
    return NextResponse.json(
      { ok: false, message: "ホームの発見データを読み込めませんでした。" },
      { status: 500 },
    );
  }

  const response = NextResponse.json({ ok: true, home });
  const serverTiming = serverTimingHeader(timing, cacheHit);
  if (serverTiming) {
    response.headers.set("Server-Timing", serverTiming);
  }
  if (cacheHit) {
    response.headers.set("X-Forge-Home-Cache", "hit");
  } else if (timing) {
    response.headers.set("X-Forge-Home-Cache", "miss");
    response.headers.set(
      "X-Forge-Home-Timing",
      JSON.stringify({
        feedbackRpcMs: timing.feedbackRpcMs,
        otherShelvesMs: timing.otherShelvesMs,
        fillMs: timing.fillMs,
        totalMs: timing.totalMs,
        feedbackRankedCount: timing.feedbackRankedCount,
        fillRan: timing.fillRan,
      }),
    );
  }
  return response;
}
