import { NextResponse } from "next/server";
import { isEmailOutboxRequestAuthorized } from "@/lib/email-outbox-auth";
import {
  createSupabaseEmailOutboxDeps,
  EMAIL_OUTBOX_MAX_ATTEMPTS,
  processEmailOutboxRows,
  type EmailOutboxRow,
} from "@/lib/email-outbox-worker";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isEmailOutboxRequestAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase unavailable" }, { status: 503 });
  }
  const { data, error } = await supabase
    .from("transactional_email_outbox")
    .select("id, to_email, template_key, payload, attempts")
    .in("status", ["pending", "failed"])
    .lte("available_at", new Date().toISOString())
    .lt("attempts", EMAIL_OUTBOX_MAX_ATTEMPTS)
    .order("available_at", { ascending: true })
    .limit(20);
  if (error) {
    console.error("[email-outbox] load failed", error);
    return NextResponse.json({ error: "Outbox load failed" }, { status: 500 });
  }

  try {
    const result = await processEmailOutboxRows(
      (data ?? []) as EmailOutboxRow[],
      createSupabaseEmailOutboxDeps(supabase),
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (cause) {
    console.error("[email-outbox] process failed", cause);
    return NextResponse.json(
      {
        ok: false,
        error: cause instanceof Error ? cause.message : "Outbox process failed",
      },
      { status: 500 },
    );
  }
}

// Vercel Cron invokes configured paths with GET and Authorization: Bearer
// <CRON_SECRET>. Keep POST for manual/operations invocations.
export async function GET(request: Request) {
  return POST(request);
}
