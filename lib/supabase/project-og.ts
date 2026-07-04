import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_PLAYABLE_VERSION } from "@/lib/playable-version";
import { resolveProjectPrimaryThumbnail } from "@/lib/project-thumbnails";
import type { ProjectRow } from "@/lib/supabase/schema";

export type ProjectOgData = {
  id: string;
  title: string;
  description: string;
  playableVersion: string;
  phase: string;
  releaseStatus: string | null;
  thumbnailUrl: string | null;
};

export async function fetchPublicProjectForOg(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectOgData | null> {
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, title, description, playable_version, phase, release_status, thumbnail_url, thumbnail_urls, visibility",
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
    | "playable_version"
    | "phase"
    | "release_status"
    | "thumbnail_url"
    | "thumbnail_urls"
    | "visibility"
  >;

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    playableVersion: row.playable_version?.trim() || DEFAULT_PLAYABLE_VERSION,
    phase: row.phase ?? "",
    releaseStatus: row.release_status ?? null,
    thumbnailUrl: resolveProjectPrimaryThumbnail(row) ?? null,
  };
}
