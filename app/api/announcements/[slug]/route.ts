import { NextResponse } from "next/server";
import { createAnonSupabaseClient } from "@/lib/supabase/anon-client";
import { fetchPublicPlatformAnnouncementBySlug } from "@/lib/supabase/player-ia-home-db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const supabase = createAnonSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "サービスが準備中です。" },
      { status: 503 },
    );
  }

  try {
    const announcement = await fetchPublicPlatformAnnouncementBySlug(
      supabase,
      slug,
    );
    if (!announcement) {
      return NextResponse.json(
        { ok: false, message: "お知らせが見つかりません。" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, announcement });
  } catch (error: unknown) {
    console.error("[announcements/slug] failed", error);
    return NextResponse.json(
      { ok: false, message: "お知らせを読み込めませんでした。" },
      { status: 500 },
    );
  }
}
