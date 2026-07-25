import { NextResponse } from "next/server";
import { createAnonSupabaseClient } from "@/lib/supabase/anon-client";
import { fetchPublicProjectUsageRelations } from "@/lib/supabase/player-ia-home-db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const supabase = createAnonSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "サービスが準備中です。" },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const limitParam = Number.parseInt(url.searchParams.get("limit") ?? "20", 10);
  const limit = Number.isFinite(limitParam) ? limitParam : 20;

  try {
    const relations = await fetchPublicProjectUsageRelations(supabase, {
      projectId,
      limit,
    });
    return NextResponse.json({ ok: true, relations });
  } catch (error: unknown) {
    console.error("[usage-relations] failed", error);
    return NextResponse.json(
      { ok: false, message: "使用関係を読み込めませんでした。" },
      { status: 500 },
    );
  }
}
