import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectRow } from "@/lib/supabase/schema";

export type ProjectOgData = {
  id: string;
  title: string;
  description: string;
  overviewIntroduction: string;
};

/**
 * Lightweight public project fetch for HTML metadata only.
 * Intentionally omits thumbnail_url / thumbnail_urls — those data: URLs can be
 * hundreds of KB and made Twitterbot HTML TTFB multi-second on cold crawl.
 * og:image always points at `/api/projects/{id}/og-image.png` instead.
 */
export async function fetchPublicProjectForOg(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectOgData | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, description, overview_introduction, visibility")
    .eq("id", projectId)
    .eq("visibility", "public")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as Pick<
    ProjectRow,
    "id" | "title" | "description" | "overview_introduction" | "visibility"
  >;

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    overviewIntroduction: row.overview_introduction ?? "",
  };
}

export type ProjectOgImageSource = {
  id: string;
  title: string;
  /** Only set when http(s); data: thumbs are not loaded for OG cards. */
  thumbnailUrl: string | null;
};

/**
 * Image route fetch — title only for now.
 * Skip thumbnail columns so cold OG generation never downloads ~500KB data URLs.
 * When Storage http(s) thumbs exist later, select a dedicated og_image_url column.
 */
export async function fetchPublicProjectForOgImage(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectOgImageSource | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, visibility")
    .eq("id", projectId)
    .eq("visibility", "public")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as { id: string; title: string };

  return {
    id: row.id,
    title: row.title,
    thumbnailUrl: null,
  };
}
