import { guestFeedbackErrorResponse, guestFeedbackOkResponse } from "@/lib/guest-feedback/errors";
import { assertGuestFeedbackRateLimit } from "@/lib/guest-feedback/rate-limit";
import {
  clearGuestSubmitterCookie,
  issueGuestSubmitterCookie,
} from "@/lib/guest-feedback/submitter-cookie";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return guestFeedbackErrorResponse("supabase_not_configured");
  }

  const rate = await assertGuestFeedbackRateLimit(supabase, request, {
    projectId: "_bootstrap",
    action: "submitter_bootstrap",
  });
  if (!rate.allowed) {
    return guestFeedbackErrorResponse("rate_limited");
  }

  const { submitterKey, issued } = await issueGuestSubmitterCookie();
  return guestFeedbackOkResponse({ submitterKey, issued }, issued ? 201 : 200);
}

export async function DELETE() {
  await clearGuestSubmitterCookie();
  return guestFeedbackOkResponse({ cleared: true });
}
