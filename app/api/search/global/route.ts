import { NextResponse } from "next/server";
import { createAnonSupabaseClient } from "@/lib/supabase/anon-client";
import { searchPublicCatalog } from "@/lib/supabase/public-catalog-db";

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
    return NextResponse.json({ ok: true, results: [] });
  }

  const limitParam = Number.parseInt(url.searchParams.get("limit") ?? "20", 10);
  const limit = Number.isFinite(limitParam) ? limitParam : 20;

  try {
    const results = await searchPublicCatalog(supabase, query, limit);
    return NextResponse.json({ ok: true, results });
  } catch (error: unknown) {
    console.error("[search/global] failed", error);
    return NextResponse.json(
      { ok: false, message: "検索に失敗しました。" },
      { status: 500 },
    );
  }
}
