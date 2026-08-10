import { NextResponse } from "next/server";
import { scheduleEmailOutboxKickBestEffort } from "@/lib/email-outbox-kick";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function authenticatedClient() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ? supabase : null;
}

/**
 * Best-effort outbox kick after registered feedback INSERT already committed.
 * Reciprocity notification/email enqueue is owned by DB INSERT triggers (093),
 * not by this route — prevents fake “feedback arrived” calls without a write.
 */
export async function POST() {
  const supabase = await authenticatedClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  scheduleEmailOutboxKickBestEffort();
  return NextResponse.json({ ok: true });
}
