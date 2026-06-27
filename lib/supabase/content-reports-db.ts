import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ContentReportReasonCode,
  ContentReportTargetType,
} from "@/lib/content-reports";

export function isContentReportsTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : String(error);

  return (
    message.includes("content_reports") &&
    (message.includes("does not exist") || message.includes("Could not find"))
  );
}

export async function submitContentReport(
  supabase: SupabaseClient,
  input: {
    reporterId: string;
    targetType: ContentReportTargetType;
    targetId: string;
    reasonCode: ContentReportReasonCode;
    details: string;
    contextLabel: string;
  },
): Promise<void> {
  const { error } = await supabase.from("content_reports").insert({
    reporter_id: input.reporterId,
    target_type: input.targetType,
    target_id: input.targetId,
    reason_code: input.reasonCode,
    details: input.details.trim(),
    context_label: input.contextLabel.trim(),
  });

  if (error && !isContentReportsTableMissingError(error)) {
    throw error;
  }
}
