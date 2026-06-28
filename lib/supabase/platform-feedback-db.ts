import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  PlatformFeedbackCategoryCode,
  PlatformFeedbackViewerMode,
} from "@/lib/platform-feedback";

export function isPlatformFeedbackTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : String(error);

  return (
    message.includes("platform_feedback") &&
    (message.includes("does not exist") || message.includes("Could not find"))
  );
}

export async function submitPlatformFeedback(
  supabase: SupabaseClient,
  input: {
    userId: string;
    category: PlatformFeedbackCategoryCode;
    message: string;
    pagePath: string;
    viewerMode: PlatformFeedbackViewerMode;
  },
): Promise<void> {
  const { error } = await supabase.from("platform_feedback").insert({
    user_id: input.userId,
    category: input.category,
    message: input.message.trim(),
    page_path: input.pagePath,
    viewer_mode: input.viewerMode,
  });

  if (error && !isPlatformFeedbackTableMissingError(error)) {
    throw error;
  }

  if (error && isPlatformFeedbackTableMissingError(error)) {
    throw new Error("platform_feedback_table_missing");
  }
}
