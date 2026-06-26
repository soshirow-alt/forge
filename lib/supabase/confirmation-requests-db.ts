import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConfirmationRequestDraft, LinkedPriorityRef } from "@/lib/confirmation-request-draft";
import { linkedPriorityIds } from "@/lib/confirmation-request-draft";
import type { ConfirmationNotifyAudienceKey } from "@/lib/confirmation-request-audience";

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
  notify_audience: ConfirmationNotifyAudienceKey[] | null;
  linked_priorities: LinkedPriorityRef[] | null;
  created_at: string;
};

function parseJsonArray<T>(value: unknown, fallback: T[]): T[] {
  if (!Array.isArray(value)) {
    return fallback;
  }
  return value as T[];
}

function rowToRecord(row: ConfirmationRequestRow): ConfirmationRequestRecord {
  return {
    id: row.id,
    devlogId: row.devlog_id,
    projectId: row.project_id,
    publishedVersion: row.published_version,
    changesSummary: row.changes_summary ?? "",
    askSummary: row.ask_summary ?? "",
    estimatedDuration: row.estimated_duration ?? "",
    linkedPriorities: parseJsonArray(row.linked_priorities, []),
    notifyAudience: parseJsonArray(row.notify_audience, []),
    notifyEnabled: row.notify_enabled,
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

function isConfirmationRequestsColumnMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : String(error);

  return (
    message.includes("confirmation_requests") &&
    (message.includes("notify_audience") ||
      message.includes("linked_priorities") ||
      message.includes("schema cache"))
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
  const baseRow = {
    devlog_id: input.devlogId,
    project_id: input.projectId,
    published_version: input.publishedVersion ?? null,
    changes_summary: input.draft.changesSummary.trim() || null,
    ask_summary: input.draft.askSummary.trim() || null,
    estimated_duration: input.draft.estimatedDuration.trim() || null,
    notify_enabled: input.draft.notifyEnabled,
  };

  const fullRow = {
    ...baseRow,
    notify_audience: input.draft.notifyAudience,
    linked_priorities: input.draft.linkedPriorities,
  };

  let result = await supabase.from("confirmation_requests").insert(fullRow).select("*").single();

  if (result.error && isConfirmationRequestsColumnMissingError(result.error)) {
    result = await supabase.from("confirmation_requests").insert(baseRow).select("*").single();
  }

  const { data, error } = result;

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

export { linkedPriorityIds };
