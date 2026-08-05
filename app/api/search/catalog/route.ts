import { NextResponse } from "next/server";
import { loadPublicCatalog } from "@/lib/player-ia/load-public-catalog";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const result = await loadPublicCatalog(url.searchParams);

  if (result.unavailable) {
    return NextResponse.json(
      { ok: false, message: "サービスが準備中です。" },
      { status: 503 },
    );
  }

  if (result.error) {
    return NextResponse.json(
      { ok: false, message: "作品一覧を読み込めませんでした。" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, projects: result.projects });
}
