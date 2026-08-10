import { NextResponse } from "next/server";
import { scheduleEmailOutboxKickBestEffort } from "@/lib/email-outbox-kick";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Body = {
  projectId?: string;
};

async function authenticatedClient() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ? supabase : null;
}

/**
 * Post-commit reciprocity side-effect for registered feedback (deep FB / voice).
 * Never fails the caller's feedback mutation — callers ignore non-2xx safely.
 */
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

  const projectId = String(body.projectId ?? "").trim();
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase.rpc("consider_feedback_reciprocity", {
      p_target_project_id: projectId,
    });
    if (error) {
      console.error("[feedback-reciprocity] rpc failed", error.message);
      return NextResponse.json({ ok: false, skipped: true });
    }
    scheduleEmailOutboxKickBestEffort();
    return NextResponse.json({
      ok: true,
      notificationId: data ? String(data) : null,
    });
  } catch (cause) {
    console.error(
      "[feedback-reciprocity] unexpected",
      cause instanceof Error ? cause.name : "unknown",
    );
    return NextResponse.json({ ok: false, skipped: true });
  }
}
