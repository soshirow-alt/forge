import type { SupabaseClient } from "@supabase/supabase-js";
import type { WitnessGrantPath } from "@/lib/witness-eligibility";

export type ProjectWitnessGrant = {
  id: string;
  projectId: string;
  userId: string;
  firstReleasedAt: string;
  grantPath: WitnessGrantPath;
  grantedAt: string;
  createdAt: string;
};

type WitnessGrantRow = {
  id: string;
  project_id: string;
  user_id: string;
  first_released_at: string;
  grant_path: WitnessGrantPath;
  granted_at: string;
  created_at: string;
};

function rowToGrant(row: WitnessGrantRow): ProjectWitnessGrant {
  return {
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    firstReleasedAt: row.first_released_at,
    grantPath: row.grant_path,
    grantedAt: row.granted_at,
    createdAt: row.created_at,
  };
}

export function isWitnessGrantsTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : String(error);

  return (
    message.includes("project_witness_grants") &&
    (message.includes("does not exist") || message.includes("Could not find"))
  );
}

export async function fetchWitnessGrantsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProjectWitnessGrant[]> {
  const { data, error } = await supabase
    .from("project_witness_grants")
    .select("*")
    .eq("user_id", userId)
    .order("granted_at", { ascending: false });

  if (error) {
    if (isWitnessGrantsTableMissingError(error)) {
      return [];
    }
    throw error;
  }

  return ((data ?? []) as WitnessGrantRow[]).map(rowToGrant);
}

export async function fetchWitnessGrantsForProjects(
  supabase: SupabaseClient,
  userId: string,
  projectIds: string[],
): Promise<ProjectWitnessGrant[]> {
  if (projectIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("project_witness_grants")
    .select("*")
    .eq("user_id", userId)
    .in("project_id", projectIds)
    .order("granted_at", { ascending: false });

  if (error) {
    if (isWitnessGrantsTableMissingError(error)) {
      return [];
    }
    throw error;
  }

  return ((data ?? []) as WitnessGrantRow[]).map(rowToGrant);
}
