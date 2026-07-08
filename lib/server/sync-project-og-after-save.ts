import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  fetchProjectForOgSync,
  syncPublicProjectOgImage,
} from "@/lib/supabase/project-og-sync";

/** Server-only — generates/uploads Storage OGP after public project save. */
export async function syncProjectOgAfterPublicSave(
  projectId: string,
): Promise<void> {
  const service = createServiceRoleClient();
  if (!service) {
    return;
  }
  const project = await fetchProjectForOgSync(service, projectId);
  if (!project) {
    return;
  }
  await syncPublicProjectOgImage(service, project);
}
