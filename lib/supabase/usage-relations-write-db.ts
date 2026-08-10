import type { SupabaseClient } from "@supabase/supabase-js";

export type UsageRelationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "removed";

export type UsageRelationRequest = {
  id: string;
  sourceProjectId: string;
  targetProjectId: string;
  requestedBy: string | null;
  requestNote: string | null;
  status: UsageRelationStatus;
  createdAt: string;
};

export async function requestProjectUsageRelation(
  supabase: SupabaseClient,
  input: { sourceProjectId: string; targetProjectId: string; note?: string },
): Promise<string> {
  const { data, error } = await supabase.rpc("request_project_usage_relation", {
    p_source_id: input.sourceProjectId,
    p_target_id: input.targetProjectId,
    p_note: input.note?.trim() || null,
  });
  if (error) throw error;
  return String(data);
}

export async function decideProjectUsageRelation(
  supabase: SupabaseClient,
  relationId: string,
  decision: "accepted" | "rejected",
): Promise<void> {
  const { error } = await supabase.rpc("decide_project_usage_relation", {
    p_relation_id: relationId,
    p_decision: decision,
  });
  if (error) throw error;
}

export async function withdrawProjectUsageRelation(
  supabase: SupabaseClient,
  relationId: string,
): Promise<void> {
  const { error } = await supabase.rpc("withdraw_project_usage_relation", {
    p_relation_id: relationId,
  });
  if (error) throw error;
}

export async function removeProjectUsageRelation(
  supabase: SupabaseClient,
  relationId: string,
): Promise<void> {
  const { error } = await supabase.rpc("remove_project_usage_relation", {
    p_relation_id: relationId,
  });
  if (error) throw error;
}

export async function fetchMyPendingUsageRelations(
  supabase: SupabaseClient,
  currentUserId: string,
  ownedProjectIds: string[],
): Promise<UsageRelationRequest[]> {
  if (!currentUserId || ownedProjectIds.length === 0) return [];
  const { data, error } = await supabase
    .from("project_usage_relations")
    .select("id, source_project_id, target_project_id, requested_by, request_note, status, created_at")
    .eq("status", "pending")
    .neq("requested_by", currentUserId)
    .or(
      `source_project_id.in.(${ownedProjectIds.join(",")}),target_project_id.in.(${ownedProjectIds.join(",")})`,
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .filter((row) => String(row.requested_by ?? "") !== currentUserId)
    .map((row) => ({
      id: String(row.id),
      sourceProjectId: String(row.source_project_id),
      targetProjectId: String(row.target_project_id),
      requestedBy: row.requested_by ? String(row.requested_by) : null,
      requestNote: row.request_note ? String(row.request_note) : null,
      status: row.status as UsageRelationStatus,
      createdAt: String(row.created_at),
    }));
}

/**
 * Recent accepted/rejected relations requested by the current user (for post-display ack).
 * Limit is 100 (not 20) so unacknowledged results stay visible longer; hash deep-links
 * still fetch a focused id via {@link fetchUsageRelationByIdForRequester} when older.
 */
export const DECIDED_USAGE_RELATIONS_LIMIT = 100;

const USAGE_RELATION_FOCUS_HASH_RE =
  /^#?usage-relation-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

/** Parse `/consultations#usage-relation-<uuid>` (with or without leading #). */
export function parseUsageRelationFocusId(hashOrFragment: string): string | null {
  const raw = hashOrFragment.trim();
  if (!raw) return null;
  const normalized = raw.startsWith("#") ? raw.slice(1) : raw;
  const match = normalized.match(USAGE_RELATION_FOCUS_HASH_RE);
  return match?.[1] ?? null;
}

function mapUsageRelationRow(row: {
  id: unknown;
  source_project_id: unknown;
  target_project_id: unknown;
  requested_by: unknown;
  request_note: unknown;
  status: unknown;
  created_at: unknown;
}): UsageRelationRequest {
  return {
    id: String(row.id),
    sourceProjectId: String(row.source_project_id),
    targetProjectId: String(row.target_project_id),
    requestedBy: row.requested_by ? String(row.requested_by) : null,
    requestNote: row.request_note ? String(row.request_note) : null,
    status: row.status as UsageRelationStatus,
    createdAt: String(row.created_at),
  };
}

export async function fetchMyDecidedUsageRelations(
  supabase: SupabaseClient,
  currentUserId: string,
  limit = DECIDED_USAGE_RELATIONS_LIMIT,
): Promise<UsageRelationRequest[]> {
  if (!currentUserId) return [];
  const { data, error } = await supabase
    .from("project_usage_relations")
    .select("id, source_project_id, target_project_id, requested_by, request_note, status, created_at")
    .eq("requested_by", currentUserId)
    .in("status", ["accepted", "rejected"])
    .order("decided_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapUsageRelationRow);
}

/** Load one decided relation by id; requester must be `requested_by` (notification recipient). */
export async function fetchUsageRelationByIdForRequester(
  supabase: SupabaseClient,
  currentUserId: string,
  relationId: string,
): Promise<UsageRelationRequest | null> {
  if (!currentUserId || !relationId) return null;
  const { data, error } = await supabase
    .from("project_usage_relations")
    .select("id, source_project_id, target_project_id, requested_by, request_note, status, created_at")
    .eq("id", relationId)
    .eq("requested_by", currentUserId)
    .in("status", ["accepted", "rejected"])
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapUsageRelationRow(data);
}
