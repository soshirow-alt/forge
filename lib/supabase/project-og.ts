import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_PLAYABLE_VERSION } from "@/lib/playable-version";
import { isHttpsThumbnailUrl } from "@/lib/supabase/project-thumbnail-storage";
import type { ProjectRow } from "@/lib/supabase/schema";

export type ProjectOgData = {
  id: string;
  title: string;
  description: string;
  overviewIntroduction: string;
  playableVersion: string;
  phase: string;
  releaseStatus: string | null;
  /** Derived 1200×630 OGP HTTPS URL from RPC — never gallery thumbnail_url. */
  ogImageUrl: string | null;
};

async function fetchHttpsOgImageUrl(
  supabase: SupabaseClient,
  projectId: string,
): Promise<string | null> {
  // Preferred: https-only RPC over og_image_url (migration 063).
  try {
    const { data, error } = await supabase.rpc(
      "get_public_project_og_image_url" as never,
      { p_project_id: projectId } as never,
    );
    if (!error && typeof data === "string" && isHttpsThumbnailUrl(data)) {
      return data.trim();
    }
  } catch {
    // RPC may be missing until 063 is applied on the target DB.
  }

  // Fallback: select og_image_url only (never thumbnail_url / data URLs).
  const { data, error } = await supabase
    .from("projects")
    .select("og_image_url")
    .eq("id", projectId)
    .eq("visibility", "public")
    .like("og_image_url", "https://%")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const url = (data as { og_image_url?: string | null }).og_image_url;
  return isHttpsThumbnailUrl(url) ? url!.trim() : null;
}

/**
 * Load public project metadata for OGP without selecting gallery thumbnail blobs.
 */
export async function fetchPublicProjectForOg(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectOgData | null> {
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

  const ogImageUrl = await fetchHttpsOgImageUrl(supabase, projectId);

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    overviewIntroduction: row.overview_introduction ?? "",
    playableVersion: row.playable_version?.trim() || DEFAULT_PLAYABLE_VERSION,
    phase: row.phase ?? "",
    releaseStatus: row.release_status ?? null,
    ogImageUrl,
  };
}
