import { NextResponse } from "next/server";
import { createAnonSupabaseClient } from "@/lib/supabase/anon-client";
import { fetchPlayerIaHome } from "@/lib/supabase/player-ia-home-db";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createAnonSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "サービスが準備中です。" },
      { status: 503 },
    );
  }

  try {
    const home = await fetchPlayerIaHome(supabase);
    return NextResponse.json({ ok: true, home });
  } catch (error: unknown) {
    console.error("[player-ia-home] failed", error);
    return NextResponse.json(
      { ok: false, message: "ホームの発見データを読み込めませんでした。" },
      { status: 500 },
    );
  }
}
