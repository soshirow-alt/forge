import { NextResponse } from "next/server";
import { scheduleEmailOutboxKickBestEffort } from "@/lib/email-outbox-kick";
import { createClient } from "@/lib/supabase/server";
import { requestProjectUsageRelation } from "@/lib/supabase/usage-relations-write-db";

export const runtime = "nodejs";

type Body = {
  sourceProjectId?: string;
  targetProjectId?: string;
  note?: string;
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

  const sourceProjectId = String(body.sourceProjectId ?? "").trim();
  const targetProjectId = String(body.targetProjectId ?? "").trim();
  if (!sourceProjectId || !targetProjectId) {
    return NextResponse.json(
      { error: "sourceProjectId and targetProjectId are required" },
      { status: 400 },
    );
  }

  try {
    const relationId = await requestProjectUsageRelation(supabase, {
      sourceProjectId,
      targetProjectId,
      note: body.note,
    });
    scheduleEmailOutboxKickBestEffort();
    return NextResponse.json({ relationId }, { status: 201 });
  } catch (error) {
    console.error("[usage-relations] request failed", error);
    return NextResponse.json(
      { error: "使用関係を登録できませんでした。" },
      { status: 400 },
    );
  }
}
