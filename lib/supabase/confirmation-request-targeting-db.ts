import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConfirmationNotifyAudienceKey } from "@/lib/confirmation-request-audience";
import { DEFAULT_CONFIRMATION_NOTIFY_AUDIENCE } from "@/lib/confirmation-request-audience";

export function isConfirmationTargetingRpcMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : String(error);

  return (
    message.includes("get_confirmation_notify_recipients") &&
    (message.includes("does not exist") || message.includes("Could not find"))
  );
}

export async function fetchConfirmationNotifyRecipientIds(
  supabase: SupabaseClient,
  input: {
    projectId: string;
    notifyAudience: ConfirmationNotifyAudienceKey[];
    versionKey?: string | null;
    linkedPriorityIds: string[];
  },
): Promise<string[]> {
  const audience =
    input.notifyAudience.length > 0
      ? input.notifyAudience
      : DEFAULT_CONFIRMATION_NOTIFY_AUDIENCE;

  const { data, error } = await supabase.rpc("get_confirmation_notify_recipients", {
    p_project_id: input.projectId,
    p_audience: audience,
    p_version_key: input.versionKey ?? null,
    p_linked_priority_ids: input.linkedPriorityIds,
  });

  if (error) {
    if (isConfirmationTargetingRpcMissingError(error)) {
      return [];
    }
    throw error;
  }

  return (data ?? []) as string[];
}
