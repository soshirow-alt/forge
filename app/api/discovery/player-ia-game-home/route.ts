import { NextResponse } from "next/server";
import { shouldServePlayerIaRedesign } from "@/lib/player-ia-mode";
import { loadPlayerIaGameHome } from "@/lib/player-ia/load-player-ia-game-home";
import { createAnonSupabaseClient } from "@/lib/supabase/anon-client";

export const runtime = "nodejs";

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

  const home = await loadPlayerIaGameHome();
  if (!home) {
    return NextResponse.json(
      { ok: false, message: "ゲームホームの発見データを読み込めませんでした。" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, home });
}
