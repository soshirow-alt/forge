import { NextResponse } from "next/server";
import { createAnonSupabaseClient } from "@/lib/supabase/anon-client";
import { searchPublicCatalogSuggest } from "@/lib/supabase/public-catalog-db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = createAnonSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "サービスが準備中です。" },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    return NextResponse.json({ ok: true, suggestions: [] });
  }

  const limitParam = Number.parseInt(url.searchParams.get("limit") ?? "8", 10);
  const limit = Number.isFinite(limitParam) ? limitParam : 8;

  try {
    const suggestions = await searchPublicCatalogSuggest(supabase, query, limit);
    return NextResponse.json({ ok: true, suggestions });
  } catch (error: unknown) {
    console.error("[search/suggest] failed", error);
    return NextResponse.json(
      { ok: false, message: "検索候補を読み込めませんでした。" },
      { status: 500 },
    );
  }
}
