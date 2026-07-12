import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { fetchHomeDiscoveryFeed } from "@/lib/supabase/home-discovery-db";

export const runtime = "nodejs";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json(
      { ok: false, message: "サービスが準備中です。" },
      { status: 503 },
    );
  }

  try {
    const supabase = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    const feed = await fetchHomeDiscoveryFeed(supabase);
    return NextResponse.json({ ok: true, feed });
  } catch (error: unknown) {
    console.error("[home-feed] failed", error);
    return NextResponse.json(
      { ok: false, message: "ホームの発見データを読み込めませんでした。" },
      { status: 500 },
    );
  }
}
