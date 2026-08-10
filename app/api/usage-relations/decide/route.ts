import { NextResponse } from "next/server";
import { scheduleEmailOutboxKickBestEffort } from "@/lib/email-outbox-kick";
import { createClient } from "@/lib/supabase/server";
import { decideProjectUsageRelation } from "@/lib/supabase/usage-relations-write-db";

export const runtime = "nodejs";

type Body = {
  relationId?: string;
  decision?: string;
};

async function authenticatedClient() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ? supabase : null;
}

export async function POST(request: Request) {
  const supabase = await authenticatedClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const relationId = String(body.relationId ?? "").trim();
  const decision =
    body.decision === "accepted" || body.decision === "rejected"
      ? body.decision
      : null;
  if (!relationId || !decision) {
    return NextResponse.json(
      { error: "relationId and decision (accepted|rejected) are required" },
      { status: 400 },
    );
  }

  try {
    await decideProjectUsageRelation(supabase, relationId, decision);
    scheduleEmailOutboxKickBestEffort();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[usage-relations] decide failed", error);
    return NextResponse.json(
      { error: "使用関係の決定を保存できませんでした。" },
      { status: 400 },
    );
  }
}
