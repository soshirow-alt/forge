import type { SupabaseClient } from "@supabase/supabase-js";
import type { DevlogEntry } from "@/lib/devlogs";

type DevlogRow = {
  id: string;
  project_id: string;
  author_id: string;
  title: string;
  content: string;
  published_version: string | null;
  created_at: string;
};

function devlogRowToEntry(row: DevlogRow): DevlogEntry {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    content: row.content,
    date: row.created_at.split("T")[0] ?? row.created_at,
    publishedVersion: row.published_version ?? undefined,
  };
}

export async function fetchAllProjectDevlogs(
  supabase: SupabaseClient,
): Promise<DevlogEntry[]> {
  const { data, error } = await supabase
    .from("project_devlogs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as DevlogRow[]).map(devlogRowToEntry);
}

export type InsertProjectDevlogOptions = {
  publishedVersion?: string | null;
  /** Bootstrap submit log only — excluded from home "recently updated". */
  isInitialPublish?: boolean;
};

export async function insertProjectDevlog(
  supabase: SupabaseClient,
  authorId: string,
  projectId: string,
  title: string,
  content: string,
  options?: InsertProjectDevlogOptions,
): Promise<DevlogEntry> {
  const basePayload: Record<string, unknown> = {
    project_id: projectId,
    author_id: authorId,
    title: title.trim(),
    content: content.trim(),
    published_version: options?.publishedVersion ?? null,
  };

  const withFlag = {
    ...basePayload,
    is_initial_publish: options?.isInitialPublish === true,
  };

  let { data, error } = await supabase
    .from("project_devlogs")
    .insert(withFlag)
    .select("*")
    .single();

  // Schema lag: column not yet applied — retry without flag (defaults false once added).
  if (
    error &&
    /is_initial_publish/i.test(error.message) &&
    /does not exist|schema cache|could not find/i.test(error.message)
  ) {
    ({ data, error } = await supabase
      .from("project_devlogs")
      .insert(basePayload)
      .select("*")
      .single());
  }

  if (error) {
    throw error;
  }

  return devlogRowToEntry(data as DevlogRow);
}

export async function fetchProjectDevlogsForProjects(
  supabase: SupabaseClient,
  projectIds: string[],
): Promise<DevlogEntry[]> {
  if (projectIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("project_devlogs")
    .select("*")
    .in("project_id", projectIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as DevlogRow[]).map(devlogRowToEntry);
}

export async function fetchProjectDevlogsForProject(
  supabase: SupabaseClient,
  projectId: string,
): Promise<DevlogEntry[]> {
  return fetchProjectDevlogsForProjects(supabase, [projectId]);
}

export async function deleteProjectDevlogsByProjectId(
  supabase: SupabaseClient,
  projectId: string,
): Promise<void> {
  const { error } = await supabase
    .from("project_devlogs")
    .delete()
    .eq("project_id", projectId);

  if (error) {
    throw error;
  }
}

export async function fetchWatcherUserIds(
  supabase: SupabaseClient,
  projectId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("project_watches")
    .select("user_id")
    .eq("project_id", projectId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => row.user_id);
}
