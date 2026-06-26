import type { SupabaseClient } from "@supabase/supabase-js";
import {
  helpfulMarkKey,
  type HelpfulMarkSourceType,
} from "@/lib/developer-helpful-mark";

type HelpfulMarkRow = {
  id: string;
  project_id: string;
  developer_id: string;
  source_type: HelpfulMarkSourceType;
  source_id: string;
  created_at: string;
};

export function isHelpfulMarksTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : String(error);

  return (
    message.includes("developer_feedback_helpful_marks") &&
    (message.includes("does not exist") || message.includes("Could not find"))
  );
}

export async function fetchHelpfulMarksForProject(
  supabase: SupabaseClient,
  developerId: string,
  projectId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("developer_feedback_helpful_marks")
    .select("source_type, source_id")
    .eq("developer_id", developerId)
    .eq("project_id", projectId);

  if (error) {
    if (isHelpfulMarksTableMissingError(error)) {
      return new Set();
    }
    throw error;
  }

  return new Set(
    ((data ?? []) as Pick<HelpfulMarkRow, "source_type" | "source_id">[]).map(
      (row) => helpfulMarkKey(row.source_type, row.source_id),
    ),
  );
}

export async function countHelpfulMarksForProject(
  supabase: SupabaseClient,
  developerId: string,
  projectId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("developer_feedback_helpful_marks")
    .select("id", { count: "exact", head: true })
    .eq("developer_id", developerId)
    .eq("project_id", projectId);

  if (error) {
    if (isHelpfulMarksTableMissingError(error)) {
      return 0;
    }
    throw error;
  }

  return count ?? 0;
}

export async function markFeedbackHelpful(
  supabase: SupabaseClient,
  input: {
    developerId: string;
    projectId: string;
    sourceType: HelpfulMarkSourceType;
    sourceId: string;
  },
): Promise<void> {
  const { error } = await supabase.from("developer_feedback_helpful_marks").insert({
    project_id: input.projectId,
    developer_id: input.developerId,
    source_type: input.sourceType,
    source_id: input.sourceId,
  });

  if (error) {
    if (isHelpfulMarksTableMissingError(error)) {
      return;
    }
    throw error;
  }
}

export async function unmarkFeedbackHelpful(
  supabase: SupabaseClient,
  input: {
    developerId: string;
    sourceType: HelpfulMarkSourceType;
    sourceId: string;
  },
): Promise<void> {
  const { error } = await supabase
    .from("developer_feedback_helpful_marks")
    .delete()
    .eq("developer_id", input.developerId)
    .eq("source_type", input.sourceType)
    .eq("source_id", input.sourceId);

  if (error) {
    if (isHelpfulMarksTableMissingError(error)) {
      return;
    }
    throw error;
  }
}
