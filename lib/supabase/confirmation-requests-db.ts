import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConfirmationRequestDraft } from "@/lib/confirmation-request-draft";

export type ConfirmationRequestRecord = ConfirmationRequestDraft & {
  id: string;
  devlogId: string;
  projectId: string;
  publishedVersion: string | null;
  createdAt: string;
};

type ConfirmationRequestRow = {
  id: string;
  devlog_id: string;
  project_id: string;
  published_version: string | null;
  changes_summary: string | null;
  ask_summary: string | null;
  estimated_duration: string | null;
  notify_enabled: boolean;
  created_at: string;
};

function rowToRecord(row: ConfirmationRequestRow): ConfirmationRequestRecord {
  return {
    id: row.id,
    devlogId: row.devlog_id,
    projectId: row.project_id,
    publishedVersion: row.published_version,
    changesSummary: row.changes_summary ?? "",
    askSummary: row.ask_summary ?? "",
    estimatedDuration: row.estimated_duration ?? "",
    createdAt: row.created_at,
  };
}

export function isConfirmationRequestsTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : String(error);

  return (
    message.includes("confirmation_requests") &&
    (message.includes("does not exist") || message.includes("Could not find"))
  );
}

export type InsertConfirmationRequestInput = {
  devlogId: string;
  projectId: string;
  publishedVersion?: string | null;
  draft: ConfirmationRequestDraft;
};

export async function insertConfirmationRequest(
  supabase: SupabaseClient,
  input: InsertConfirmationRequestInput,
): Promise<ConfirmationRequestRecord | null> {
  const { data, error } = await supabase
    .from("confirmation_requests")
    .insert({
      devlog_id: input.devlogId,
      project_id: input.projectId,
      published_version: input.publishedVersion ?? null,
      changes_summary: input.draft.changesSummary.trim() || null,
      ask_summary: input.draft.askSummary.trim() || null,
      estimated_duration: input.draft.estimatedDuration.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    if (isConfirmationRequestsTableMissingError(error)) {
      return null;
    }
    throw error;
  }

  return rowToRecord(data as ConfirmationRequestRow);
}

export async function fetchConfirmationRequestByDevlogId(
  supabase: SupabaseClient,
  devlogId: string,
): Promise<ConfirmationRequestRecord | null> {
  const { data, error } = await supabase
    .from("confirmation_requests")
    .select("*")
    .eq("devlog_id", devlogId)
    .maybeSingle();

  if (error) {
    if (isConfirmationRequestsTableMissingError(error)) {
      return null;
    }
    throw error;
  }

  if (!data) {
    return null;
  }

  return rowToRecord(data as ConfirmationRequestRow);
}

export async function fetchConfirmationRequestsByDevlogIds(
  supabase: SupabaseClient,
  devlogIds: string[],
): Promise<Map<string, ConfirmationRequestRecord>> {
  if (devlogIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("confirmation_requests")
    .select("*")
    .in("devlog_id", devlogIds);

  if (error) {
    if (isConfirmationRequestsTableMissingError(error)) {
      return new Map();
    }
    throw error;
  }

  const map = new Map<string, ConfirmationRequestRecord>();
  for (const row of (data ?? []) as ConfirmationRequestRow[]) {
    map.set(row.devlog_id, rowToRecord(row));
  }
  return map;
}
