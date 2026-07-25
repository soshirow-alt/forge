import { guestFeedbackErrorResponse, guestFeedbackOkResponse } from "@/lib/guest-feedback/errors";
import { assertGuestFeedbackRateLimit } from "@/lib/guest-feedback/rate-limit";
import { readGuestSubmitterKeyFromCookie } from "@/lib/guest-feedback/submitter-cookie";
import type { GuestDetailedFeedbackInput } from "@/lib/guest-feedback/types";
import {
  assertPublicProject,
  loadPublicProjectContext,
  normalizeGuestVersionKey,
  validateGuestDetailedFeedback,
} from "@/lib/guest-feedback/validation";
import {
  isGuestFeedbackTableMissingError,
  upsertGuestDetailedFeedback,
} from "@/lib/supabase/guest-feedback-db";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  if (process.env.VERCEL_ENV === "production") {
    return guestFeedbackErrorResponse("guest_feedback_disabled");
  }

  const { projectId } = await context.params;
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return guestFeedbackErrorResponse("supabase_not_configured");
  }

  const submitterKey = await readGuestSubmitterKeyFromCookie();
  if (!submitterKey) {
    return guestFeedbackErrorResponse("submitter_key_missing");
  }

  let body: GuestDetailedFeedbackInput;
  try {
    body = (await request.json()) as GuestDetailedFeedbackInput;
  } catch {
    return guestFeedbackErrorResponse("validation_error");
  }

  const normalized = validateGuestDetailedFeedback(body);
  if (!normalized) {
    return guestFeedbackErrorResponse("empty_detailed_feedback");
  }

  const project = await loadPublicProjectContext(supabase, projectId);
  if (!project) {
    return guestFeedbackErrorResponse("project_not_found");
  }
  if (!assertPublicProject(project)) {
    return guestFeedbackErrorResponse("project_not_public");
  }

  const versionKey = normalizeGuestVersionKey(project, normalized.versionKey);
  if (!versionKey) {
    return guestFeedbackErrorResponse("invalid_version_key");
  }

  normalized.versionKey = versionKey;

  const rate = await assertGuestFeedbackRateLimit(supabase, request, {
    projectId: project.projectId,
    action: "detailed",
    submitterKey,
  });
  if (!rate.allowed) {
    return guestFeedbackErrorResponse("rate_limited");
  }

  try {
    const feedback = await upsertGuestDetailedFeedback(
      supabase,
      project.projectId,
      submitterKey,
      normalized,
    );
    return guestFeedbackOkResponse({ submitterKey, feedback });
  } catch (error) {
    if (isGuestFeedbackTableMissingError(error)) {
      return guestFeedbackErrorResponse("supabase_not_configured");
    }
    console.error("guest detailed feedback upsert failed", error);
    return guestFeedbackErrorResponse("internal_error");
  }
}
