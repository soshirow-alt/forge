import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_PLAYABLE_VERSION } from "@/lib/playable-version";
import type { ProjectRow } from "@/lib/supabase/schema";

export type ProjectOgData = {
  id: string;
  title: string;
  description: string;
  overviewIntroduction: string;
  playableVersion: string;
  phase: string;
  releaseStatus: string | null;
  thumbnailUrl: string | null;
};

export async function fetchPublicProjectForOg(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectOgData | null> {
  // Do not select thumbnail_url / thumbnail_urls — Production rows may be
  // multi-MB data URLs, and OGP currently falls back to default when no http(s).
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, title, description, overview_introduction, playable_version, phase, release_status, visibility",
    )
    .eq("id", projectId)
    .eq("visibility", "public")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as Pick<
    ProjectRow,
    | "id"
    | "title"
    | "description"
    | "overview_introduction"
    | "playable_version"
    | "phase"
    | "release_status"
    | "visibility"
  >;

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    overviewIntroduction: row.overview_introduction ?? "",
    playableVersion: row.playable_version?.trim() || DEFAULT_PLAYABLE_VERSION,
    phase: row.phase ?? "",
    releaseStatus: row.release_status ?? null,
    thumbnailUrl: null,
  };
}
