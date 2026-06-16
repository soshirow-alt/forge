import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ProjectReleaseEvent,
  ProjectReleaseEventType,
  ProjectReleaseStatus,
} from "@/lib/project-release-state";
import { releaseStatusAfterEvent } from "@/lib/project-release-state";

type ReleaseEventRow = {
  id: string;
  project_id: string;
  event_type: ProjectReleaseEventType;
  actor_user_id: string;
  note: string | null;
  created_at: string;
};

function rowToEvent(row: ReleaseEventRow): ProjectReleaseEvent {
  return {
    id: row.id,
    projectId: row.project_id,
    eventType: row.event_type,
    actorUserId: row.actor_user_id,
    note: row.note,
    createdAt: row.created_at,
  };
}

export function isReleaseEventsTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : String(error);

  return (
    (message.includes("project_release_events") ||
      message.includes("release_status")) &&
    (message.includes("does not exist") || message.includes("Could not find"))
  );
}

export async function fetchAllProjectReleaseEvents(
  supabase: SupabaseClient,
): Promise<ProjectReleaseEvent[]> {
  const { data, error } = await supabase
    .from("project_release_events")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    if (isReleaseEventsTableMissingError(error)) {
      return [];
    }
    throw error;
  }

  return ((data ?? []) as ReleaseEventRow[]).map(rowToEvent);
}

export async function fetchReleaseEventsForProject(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectReleaseEvent[]> {
  const { data, error } = await supabase
    .from("project_release_events")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    if (isReleaseEventsTableMissingError(error)) {
      return [];
    }
    throw error;
  }

  return ((data ?? []) as ReleaseEventRow[]).map(rowToEvent);
}

export async function fetchReleaseEventsForProjects(
  supabase: SupabaseClient,
  projectIds: string[],
): Promise<ProjectReleaseEvent[]> {
  if (projectIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("project_release_events")
    .select("*")
    .in("project_id", projectIds)
    .order("created_at", { ascending: true });

  if (error) {
    if (isReleaseEventsTableMissingError(error)) {
      return [];
    }
    throw error;
  }

  return ((data ?? []) as ReleaseEventRow[]).map(rowToEvent);
}

export type InsertReleaseEventInput = {
  projectId: string;
  eventType: ProjectReleaseEventType;
  actorUserId: string;
  note?: string | null;
};

export async function insertProjectReleaseEvent(
  supabase: SupabaseClient,
  input: InsertReleaseEventInput,
): Promise<ProjectReleaseEvent> {
  const nextStatus = releaseStatusAfterEvent(input.eventType);

  const { data: eventRow, error: eventError } = await supabase
    .from("project_release_events")
    .insert({
      project_id: input.projectId,
      event_type: input.eventType,
      actor_user_id: input.actorUserId,
      note: input.note?.trim() || null,
    })
    .select("*")
    .single();

  if (eventError) {
    throw eventError;
  }

  const { error: statusError } = await supabase
    .from("projects")
    .update({ release_status: nextStatus })
    .eq("id", input.projectId);

  if (statusError) {
    throw statusError;
  }

  return rowToEvent(eventRow as ReleaseEventRow);
}

export async function fetchProjectReleaseStatus(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectReleaseStatus> {
  const { data, error } = await supabase
    .from("projects")
    .select("release_status")
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    if (isReleaseEventsTableMissingError(error)) {
      return "in_development";
    }
    throw error;
  }

  return (data?.release_status as ProjectReleaseStatus | undefined) ?? "in_development";
}
