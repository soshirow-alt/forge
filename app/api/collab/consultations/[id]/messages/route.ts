import { NextResponse } from "next/server";
import { scheduleEmailOutboxKickBestEffort } from "@/lib/email-outbox-kick";
import { createClient } from "@/lib/supabase/server";
import { sendCollabConsultationMessage } from "@/lib/supabase/collab-consultations-db";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const message = body.body?.trim() ?? "";
  if (message.length < 1 || message.length > 4000) {
    return NextResponse.json({ error: "メッセージは1〜4000文字です。" }, { status: 400 });
  }
  try {
    const messageId = await sendCollabConsultationMessage(
      supabase,
      (await context.params).id,
      message,
    );
    scheduleEmailOutboxKickBestEffort();
    return NextResponse.json({ messageId }, { status: 201 });
  } catch (error) {
    console.error("[collab-consultations] send failed", error);
    return NextResponse.json({ error: "メッセージを送信できませんでした。" }, { status: 400 });
  }
}
