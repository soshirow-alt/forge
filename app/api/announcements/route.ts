import { NextResponse } from "next/server";
import { createAnonSupabaseClient } from "@/lib/supabase/anon-client";
import { fetchPublicPlatformAnnouncements } from "@/lib/supabase/player-ia-home-db";

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
  const limitParam = Number.parseInt(url.searchParams.get("limit") ?? "20", 10);
  const offsetParam = Number.parseInt(url.searchParams.get("offset") ?? "0", 10);
  const limit = Number.isFinite(limitParam) ? limitParam : 20;
  const offset = Number.isFinite(offsetParam) ? offsetParam : 0;

  try {
    const announcements = await fetchPublicPlatformAnnouncements(
      supabase,
      limit + offset,
    );
    return NextResponse.json({
      ok: true,
      announcements: announcements.slice(offset, offset + limit),
    });
  } catch (error: unknown) {
    console.error("[announcements] failed", error);
    return NextResponse.json(
      { ok: false, message: "お知らせを読み込めませんでした。" },
      { status: 500 },
    );
  }
}
