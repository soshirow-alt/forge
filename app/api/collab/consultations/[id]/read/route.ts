import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  listPairConsultationIds,
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
    const { data: row, error } = await supabase
      .from("collab_consultations")
      .select("id, initiator_id, counterpart_id")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const seed = {
      initiatorId: String(row.initiator_id),
      counterpartId: String(row.counterpart_id),
    };

    const [pairIds] = await Promise.all([
      listPairConsultationIds(supabase, seed),
      markCollabConsultationRead(supabase, id),
    ]);

    const ids = pairIds.length > 0 ? pairIds : [id];
    await Promise.all(
      ids.map((consultationId) =>
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
