import { NextResponse } from "next/server";
import {
  createCollabConsultation,
  listMyCollabConsultations,
} from "@/lib/supabase/collab-consultations-db";
import { scheduleEmailOutboxKickBestEffort } from "@/lib/email-outbox-kick";
import { createClient } from "@/lib/supabase/server";
import {
  isCollabConsultationPurpose,
  type CollabConsultationPurpose,
} from "@/lib/collab/consultation-types";

export const runtime = "nodejs";

async function authenticatedClient() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ? supabase : null;
}

export async function GET() {
  const supabase = await authenticatedClient();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({
      consultations: await listMyCollabConsultations(supabase),
    });
  } catch (error) {
    console.error("[collab-consultations] list failed", error);
    return NextResponse.json({ error: "相談を読み込めませんでした。" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await authenticatedClient();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: {
    counterpartId?: string;
    purpose?: CollabConsultationPurpose;
    firstMessage?: string;
    initiatorProjectId?: string | null;
    counterpartProjectId?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const firstMessage = body.firstMessage?.trim() ?? "";
  if (
    !body.counterpartId ||
    !isCollabConsultationPurpose(body.purpose) ||
    firstMessage.length < 1 ||
    firstMessage.length > 4000
  ) {
    return NextResponse.json({ error: "入力内容を確認してください。" }, { status: 400 });
  }
  try {
    const consultationId = await createCollabConsultation(supabase, {
      counterpartId: body.counterpartId,
      purpose: body.purpose,
      firstMessage,
      initiatorProjectId: body.initiatorProjectId,
      counterpartProjectId: body.counterpartProjectId,
    });
    // Mutation already committed; email failure must not change this response.
    scheduleEmailOutboxKickBestEffort();
    return NextResponse.json({ consultationId }, { status: 201 });
  } catch (error) {
    console.error("[collab-consultations] create failed", error);
    return NextResponse.json({ error: "相談を開始できませんでした。" }, { status: 400 });
  }
}
