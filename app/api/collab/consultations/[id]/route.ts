import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchCollabConsultationDetail } from "@/lib/supabase/collab-consultations-db";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const detail = await fetchCollabConsultationDetail(
      supabase,
      (await context.params).id,
    );
    if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(detail);
  } catch (error) {
    console.error("[collab-consultations] detail failed", error);
    return NextResponse.json({ error: "相談を読み込めませんでした。" }, { status: 500 });
  }
}
