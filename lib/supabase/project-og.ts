import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectRow } from "@/lib/supabase/schema";

export type ProjectOgData = {
  id: string;
  title: string;
  description: string;
  overviewIntroduction: string;
  ogImageUrl: string | null;
};

const OG_META_SELECT_WITH_URL =
  "id, title, description, overview_introduction, visibility, og_image_url";
const OG_META_SELECT_BASE =
  "id, title, description, overview_introduction, visibility";

function rowToOgData(
  row: Pick<
    ProjectRow,
    "id" | "title" | "description" | "overview_introduction"
  > & { og_image_url?: string | null },
): ProjectOgData {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    overviewIntroduction: row.overview_introduction ?? "",
    ogImageUrl: row.og_image_url?.trim() || null,
  };
}

/**
 * Lightweight public project fetch for HTML metadata.
 * Omits thumbnail columns (can be huge data: URLs) — og:image uses og_image_url.
 */
export async function fetchPublicProjectForOg(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectOgData | null> {
  const withUrl = await supabase
    .from("projects")
    .select(OG_META_SELECT_WITH_URL)
    .eq("id", projectId)
    .eq("visibility", "public")
    .maybeSingle();

  if (!withUrl.error && withUrl.data) {
    return rowToOgData(withUrl.data as ProjectRow & { og_image_url?: string | null });
  }

  if (
    withUrl.error?.message?.includes("og_image_url") ||
    withUrl.error?.message?.includes("does not exist")
  ) {
    const fallback = await supabase
      .from("projects")
      .select(OG_META_SELECT_BASE)
      .eq("id", projectId)
      .eq("visibility", "public")
      .maybeSingle();
    if (fallback.error || !fallback.data) {
      return null;
    }
    return rowToOgData(fallback.data as ProjectRow);
  }

  return null;
}
