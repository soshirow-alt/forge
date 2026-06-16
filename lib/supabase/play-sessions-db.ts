import type { SupabaseClient } from "@supabase/supabase-js";

export type PlaySessionContext = "general" | "adoption_verify" | "new_version";

export type ProjectPlaySession = {
  id: string;
  userId: string;
  projectId: string;
  versionKey: string;
  playedAt: string;
  context: PlaySessionContext;
  adoptionId: string | null;
  createdAt: string;
};

type PlaySessionRow = {
  id: string;
  user_id: string;
  project_id: string;
  version_key: string;
  played_at: string;
  context: PlaySessionContext;
  adoption_id: string | null;
  created_at: string;
};

export type RecordPlaySessionInput = {
  projectId: string;
  versionKey: string;
  context?: PlaySessionContext;
  adoptionId?: string | null;
};

function rowToSession(row: PlaySessionRow): ProjectPlaySession {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    versionKey: row.version_key,
    playedAt: row.played_at,
    context: row.context,
    adoptionId: row.adoption_id,
    createdAt: row.created_at,
  };
}

export function isPlaySessionsTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : String(error);

  return (
    message.includes("project_play_sessions") &&
    (message.includes("does not exist") || message.includes("Could not find"))
  );
}

export async function insertProjectPlaySession(
  supabase: SupabaseClient,
  userId: string,
  input: RecordPlaySessionInput,
): Promise<ProjectPlaySession | null> {
  const { data, error } = await supabase
    .from("project_play_sessions")
    .insert({
      user_id: userId,
      project_id: input.projectId,
      version_key: input.versionKey,
      context: input.context ?? "general",
      adoption_id: input.adoptionId ?? null,
    })
    .select("*")
    .single();

  if (error) {
    if (isPlaySessionsTableMissingError(error)) {
      return null;
    }
    throw error;
  }

  return rowToSession(data as PlaySessionRow);
}

export async function fetchPlaySessionsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProjectPlaySession[]> {
  const { data, error } = await supabase
    .from("project_play_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("played_at", { ascending: false });

  if (error) {
    if (isPlaySessionsTableMissingError(error)) {
      return [];
    }
    throw error;
  }

  return ((data ?? []) as PlaySessionRow[]).map(rowToSession);
}

export type ProjectPlayFirstSeen = {
  projectId: string;
  firstPlayedAt: string;
};

export async function fetchProjectPlayFirstSeen(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProjectPlayFirstSeen[]> {
  const [sessions, plays] = await Promise.all([
    fetchPlaySessionsForUser(supabase, userId),
    supabase
      .from("project_plays")
      .select("project_id, created_at")
      .eq("user_id", userId),
  ]);

  const firstByProject = new Map<string, string>();

  for (const session of sessions) {
    const existing = firstByProject.get(session.projectId);
    if (!existing || new Date(session.playedAt).getTime() < new Date(existing).getTime()) {
      firstByProject.set(session.projectId, session.playedAt);
    }
  }

  for (const row of plays.data ?? []) {
    const projectId = row.project_id as string;
    const createdAt = row.created_at as string;
    const existing = firstByProject.get(projectId);
    if (!existing || new Date(createdAt).getTime() < new Date(existing).getTime()) {
      firstByProject.set(projectId, createdAt);
    }
  }

  return [...firstByProject.entries()].map(([projectId, firstPlayedAt]) => ({
    projectId,
    firstPlayedAt,
  }));
}
