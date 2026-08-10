import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchCollabConsultationDetail,
  markCollabConsultationRead,
} from "@/lib/supabase/collab-consultations-db";
import { acknowledgeNotificationsByCoalesceKey } from "@/lib/supabase/user-notifications-db";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = (await context.params).id;
  try {
    const detail = await fetchCollabConsultationDetail(supabase, id);
    if (!detail) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const pairIds =
      detail.pairConsultationIds.length > 0
        ? detail.pairConsultationIds
        : [detail.consultation.id];
    await markCollabConsultationRead(supabase, id);
    await Promise.all(
      pairIds.map((consultationId) =>
        acknowledgeNotificationsByCoalesceKey(
          supabase,
          `consultation:${consultationId}`,
        ),
      ),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[collab-consultations] mark read failed", error);
    return NextResponse.json({ error: "既読状態を更新できませんでした。" }, { status: 500 });
  }
}
