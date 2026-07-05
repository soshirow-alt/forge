import type { SupabaseClient } from "@supabase/supabase-js";
import { feedbackHasContent } from "@/lib/game-feedback-storage";
import { resolvePlayableVersion } from "@/lib/playable-version";
import {
  GUEST_DETAILED_FIELD_MAX,
  GUEST_VOICE_ANSWER_MAX,
} from "@/lib/guest-feedback/constants";
import type {
  GuestDetailedFeedbackInput,
  GuestPromptRecord,
  GuestVoiceAnswerInput,
  PublicProjectContext,
} from "@/lib/guest-feedback/types";
import {
  REPLAY_INTENT_OPTIONS,
  YES_NO_OPTIONS,
} from "@/lib/version-prompt-types";
import { SCALE_3_OPTIONS } from "@/lib/version-prompt-form";
import type { VersionPromptResponseKind } from "@/lib/version-prompt-types";

export async function loadPublicProjectContext(
  supabase: SupabaseClient,
  projectId: string,
): Promise<PublicProjectContext | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, visibility, playable_version")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    projectId: String(data.id),
    visibility: String(data.visibility),
    playableVersion: resolvePlayableVersion(data.playable_version as string),
  };
}

export function assertPublicProject(
  project: PublicProjectContext | null,
): project is PublicProjectContext {
  return Boolean(project && project.visibility === "public");
}

export function normalizeGuestVersionKey(
  project: PublicProjectContext,
  versionKey: string | undefined,
): string | null {
  const normalized = resolvePlayableVersion(versionKey);
  if (normalized !== project.playableVersion) {
    return null;
  }
  return normalized;
}

export async function loadGuestPromptsForVersion(
  supabase: SupabaseClient,
  projectId: string,
  versionKey: string,
  promptIds: string[],
): Promise<Map<string, GuestPromptRecord>> {
  if (promptIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("project_version_prompts")
    .select("id, project_id, version_key, prompt_text, response_kind, options, archived_at")
    .eq("project_id", projectId)
    .eq("version_key", versionKey)
    .in("id", promptIds);

  if (error || !data) {
    return new Map();
  }

  return new Map(
    data.map((row) => [
      String(row.id),
      {
        id: String(row.id),
        projectId: String(row.project_id),
        versionKey: String(row.version_key),
        promptText: String(row.prompt_text),
        responseKind: String(row.response_kind),
        options: (row.options as GuestPromptRecord["options"]) ?? null,
        archivedAt: row.archived_at ? String(row.archived_at) : null,
      },
    ]),
  );
}

function optionLabel(
  options: GuestPromptRecord["options"],
  answerValue: string,
): string | undefined {
  return options?.find((option) => option.id === answerValue)?.label;
}

export function validateGuestVoiceAnswer(
  prompt: GuestPromptRecord,
  answer: GuestVoiceAnswerInput,
): { ok: true; answerValue: string; answerLabel: string | null } | { ok: false } {
  const answerValue = answer.answerValue.trim();
  if (!answerValue || answerValue.length > GUEST_VOICE_ANSWER_MAX) {
    return { ok: false };
  }

  const kind = prompt.responseKind as VersionPromptResponseKind;

  switch (kind) {
    case "yes_no": {
      if (!YES_NO_OPTIONS.some((option) => option.id === answerValue)) {
        return { ok: false };
      }
      break;
    }
    case "scale_3": {
      if (!SCALE_3_OPTIONS.some((option) => option.id === answerValue)) {
        return { ok: false };
      }
      break;
    }
    case "replay_intent": {
      if (!REPLAY_INTENT_OPTIONS.some((option) => option.id === answerValue)) {
        return { ok: false };
      }
      break;
    }
    case "choice": {
      if (!prompt.options?.some((option) => option.id === answerValue)) {
        return { ok: false };
      }
      break;
    }
    case "short_text":
      break;
    default:
      return { ok: false };
  }

  const trimmedLabel = answer.answerLabel?.trim();
  const answerLabel =
    trimmedLabel ??
    optionLabel(prompt.options, answerValue) ??
    (kind === "short_text" ? answerValue : answerValue);

  if (answerLabel.length > GUEST_VOICE_ANSWER_MAX) {
    return { ok: false };
  }

  return { ok: true, answerValue, answerLabel };
}

function trimField(value: string | undefined, max: number): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  if (trimmed.length > max) {
    return trimmed.slice(0, max);
  }
  return trimmed;
}

export function validateGuestDetailedFeedback(
  input: GuestDetailedFeedbackInput,
): GuestDetailedFeedbackInput | null {
  const normalized: GuestDetailedFeedbackInput = {
    versionKey: resolvePlayableVersion(input.versionKey),
    goodPoints: trimField(input.goodPoints, GUEST_DETAILED_FIELD_MAX),
    concerns: trimField(input.concerns, GUEST_DETAILED_FIELD_MAX),
    bugs: trimField(input.bugs, GUEST_DETAILED_FIELD_MAX),
    otherNotes: trimField(input.otherNotes, GUEST_DETAILED_FIELD_MAX),
    focusResponse: trimField(input.focusResponse, GUEST_DETAILED_FIELD_MAX),
    wouldReplay: input.wouldReplay,
  };

  if (
    !feedbackHasContent({
      goodPoints: normalized.goodPoints,
      concerns: normalized.concerns,
      bugs: normalized.bugs,
      otherNotes: normalized.otherNotes,
      focusResponse: normalized.focusResponse,
      wouldReplay: normalized.wouldReplay,
    })
  ) {
    return null;
  }

  return normalized;
}

export function isPublicVoiceBucketKind(responseKind: string): boolean {
  return responseKind !== "short_text";
}
