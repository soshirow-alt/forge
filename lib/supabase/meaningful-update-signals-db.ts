import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type MeaningfulUpdateSignal,
  resolveMeaningfulUpdateByProject,
  type MeaningfulUpdateByProject,
} from "@/lib/meaningful-update-signals";
import {
  fetchReleaseEventsForProjects,
  isReleaseEventsTableMissingError,
} from "@/lib/supabase/project-release-events-db";

type DevlogSignalRow = {
  project_id: string;
  created_at: string;
  is_initial_publish?: boolean | null;
};

type ProjectPublishRow = {
  id: string;
  first_published_at: string | null;
};

function isMissingInitialPublishColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : String(error);
  return (
    /is_initial_publish/i.test(message) &&
    /does not exist|schema cache|could not find/i.test(message)
  );
}

async function fetchNonInitialDevlogSignals(
  supabase: SupabaseClient,
  projectIds: string[],
): Promise<MeaningfulUpdateSignal[]> {
  const withFlag = await supabase
    .from("project_devlogs")
    .select("project_id, created_at, is_initial_publish")
    .in("project_id", projectIds)
    .eq("is_initial_publish", false);

  if (!withFlag.error) {
    return ((withFlag.data ?? []) as DevlogSignalRow[]).map((row) => ({
      projectId: row.project_id,
      at: row.created_at,
      kind: "devlog" as const,
    }));
  }

  if (!isMissingInitialPublishColumn(withFlag.error)) {
    throw withFlag.error;
  }

  // Schema lag: cannot exclude initial publish — do not invent meaningful from all
  // descriptions. Prefer release / version events only (handled separately).
  return [];
}

export async function fetchFirstPublishedAtByProject(
  supabase: SupabaseClient,
  projectIds: string[],
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  if (projectIds.length === 0) {
    return map;
  }

  const { data, error } = await supabase
    .from("projects")
    .select("id, first_published_at")
    .in("id", projectIds);

  if (error) {
    throw error;
  }

  for (const row of (data ?? []) as ProjectPublishRow[]) {
    map.set(row.id, row.first_published_at);
  }
  return map;
}

export async function fetchMeaningfulUpdateByProjectIds(
  supabase: SupabaseClient,
  projectIds: string[],
): Promise<Map<string, MeaningfulUpdateByProject>> {
  if (projectIds.length === 0) {
    return new Map();
  }

  const [firstPublishedAtByProject, releaseEvents, devlogSignals] =
    await Promise.all([
      fetchFirstPublishedAtByProject(supabase, projectIds),
      fetchReleaseEventsForProjects(supabase, projectIds).catch((error) => {
        if (isReleaseEventsTableMissingError(error)) {
          return [];
        }
        throw error;
      }),
      fetchNonInitialDevlogSignals(supabase, projectIds),
    ]);

  const versionSignals: MeaningfulUpdateSignal[] = releaseEvents
    .filter(
      (event) =>
        event.eventType === "released" && event.source !== "onboarding",
    )
    .map((event) => ({
      projectId: event.projectId,
      at: event.createdAt,
      kind: "version" as const,
    }));

  return resolveMeaningfulUpdateByProject({
    signals: [...devlogSignals, ...versionSignals],
    firstPublishedAtByProject,
  });
}
