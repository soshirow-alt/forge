import {
  buildMissingProjectOgCardResponse,
  buildProjectOgCardResponse,
} from "@/lib/og-card-response";
import { isSupabaseProjectId } from "@/lib/submitted-game-v0-adapter";
import { createClient } from "@/lib/supabase/server";
import { fetchPublicProjectForOgImage } from "@/lib/supabase/project-og";

/**
 * Shared GET handler for `/og-image.png` and legacy `/og-image`.
 * Never returns 500 for crawlers — missing projects still get a branded card.
 */
export async function handleProjectOgImageGet(
  projectId: string,
): Promise<Response> {
  try {
    if (!isSupabaseProjectId(projectId)) {
      return buildMissingProjectOgCardResponse();
    }

    const supabase = await createClient();
    if (!supabase) {
      return buildMissingProjectOgCardResponse();
    }

    const project = await fetchPublicProjectForOgImage(supabase, projectId);
    if (!project) {
      return buildMissingProjectOgCardResponse();
    }

    return buildProjectOgCardResponse({
      title: project.title,
      thumbnailUrl: project.thumbnailUrl,
    });
  } catch {
    return buildMissingProjectOgCardResponse();
  }
}
