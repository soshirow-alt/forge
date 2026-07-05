import { guestFeedbackErrorResponse, guestFeedbackOkResponse } from "@/lib/guest-feedback/errors";
import { assertGuestFeedbackRateLimit } from "@/lib/guest-feedback/rate-limit";
import { readGuestSubmitterKeyFromCookie } from "@/lib/guest-feedback/submitter-cookie";
import type { PostGuestVoiceRequest } from "@/lib/guest-feedback/types";
import {
  assertPublicProject,
  loadGuestPromptsForVersion,
  loadPublicProjectContext,
  normalizeGuestVersionKey,
  validateGuestVoiceAnswer,
} from "@/lib/guest-feedback/validation";
import {
  isGuestFeedbackTableMissingError,
  upsertGuestVoiceResponse,
} from "@/lib/supabase/guest-feedback-db";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return guestFeedbackErrorResponse("supabase_not_configured");
  }

  const submitterKey = await readGuestSubmitterKeyFromCookie();
  if (!submitterKey) {
    return guestFeedbackErrorResponse("submitter_key_missing");
  }

  let body: PostGuestVoiceRequest;
  try {
    body = (await request.json()) as PostGuestVoiceRequest;
  } catch {
    return guestFeedbackErrorResponse("validation_error");
  }

  if (!body.versionKey?.trim() || !Array.isArray(body.answers) || body.answers.length === 0) {
    return guestFeedbackErrorResponse("validation_error");
  }

  const project = await loadPublicProjectContext(supabase, projectId);
  if (!project) {
    return guestFeedbackErrorResponse("project_not_found");
  }
  if (!assertPublicProject(project)) {
    return guestFeedbackErrorResponse("project_not_public");
  }

  const versionKey = normalizeGuestVersionKey(project, body.versionKey);
  if (!versionKey) {
    return guestFeedbackErrorResponse("invalid_version_key");
  }

  const promptIds = [...new Set(body.answers.map((answer) => answer.promptId?.trim()).filter(Boolean))];
  if (promptIds.length !== body.answers.length) {
    return guestFeedbackErrorResponse("validation_error");
  }

  const prompts = await loadGuestPromptsForVersion(
    supabase,
    project.projectId,
    versionKey,
    promptIds,
  );

  const rate = await assertGuestFeedbackRateLimit(supabase, request, {
    projectId: project.projectId,
    action: "voice",
    submitterKey,
    answerCount: body.answers.length,
  });
  if (!rate.allowed) {
    return guestFeedbackErrorResponse("rate_limited");
  }

  const saved = [];

  for (const answer of body.answers) {
    const prompt = prompts.get(answer.promptId);
    if (!prompt) {
      return guestFeedbackErrorResponse("invalid_prompt");
    }
    if (prompt.archivedAt) {
      return guestFeedbackErrorResponse("prompt_archived");
    }

    const validated = validateGuestVoiceAnswer(prompt, answer);
    if (!validated.ok) {
      return guestFeedbackErrorResponse("invalid_answer");
    }

    try {
      const row = await upsertGuestVoiceResponse(supabase, {
        projectId: project.projectId,
        versionKey,
        promptId: prompt.id,
        submitterKey,
        answerValue: validated.answerValue,
        answerLabel: validated.answerLabel,
      });
      saved.push(row);
    } catch (error) {
      if (isGuestFeedbackTableMissingError(error)) {
        return guestFeedbackErrorResponse("supabase_not_configured");
      }
      console.error("guest voice upsert failed", error);
      return guestFeedbackErrorResponse("internal_error");
    }
  }

  return guestFeedbackOkResponse({ submitterKey, saved });
}
