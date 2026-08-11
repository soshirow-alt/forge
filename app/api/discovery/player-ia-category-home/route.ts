import { NextResponse } from "next/server";
import { shouldServePlayerIaRedesign } from "@/lib/player-ia-mode";
import { loadPlayerIaCategoryHome } from "@/lib/player-ia/load-player-ia-category-home";
import { isProjectCategoryId } from "@/lib/project-categories";
import { createAnonSupabaseClient } from "@/lib/supabase/anon-client";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!shouldServePlayerIaRedesign()) {
    return new NextResponse(null, { status: 404 });
  }

  if (!createAnonSupabaseClient()) {
    return NextResponse.json(
      { ok: false, message: "サービスが準備中です。" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  if (!isProjectCategoryId(category) || category === "game") {
    return NextResponse.json(
      { ok: false, message: "カテゴリが不正です。" },
      { status: 400 },
    );
  }

  const home = await loadPlayerIaCategoryHome(category);
  if (!home) {
    return NextResponse.json(
      { ok: false, message: "カテゴリホームを読み込めませんでした。" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, home });
}
