import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectRow } from "@/lib/supabase/schema";

export type ProjectOgData = {
  id: string;
  title: string;
  description: string;
  overviewIntroduction: string;
  ogImageUrl: string | null;
};

/**
 * Lightweight public project fetch for HTML metadata.
 * Omits thumbnail columns (can be huge data: URLs) — og:image uses og_image_url.
 */
export async function fetchPublicProjectForOg(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectOgData | null> {
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, title, description, overview_introduction, visibility, og_image_url",
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
    | "visibility"
  > & { og_image_url?: string | null };

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    overviewIntroduction: row.overview_introduction ?? "",
    ogImageUrl: row.og_image_url?.trim() || null,
  };
}
