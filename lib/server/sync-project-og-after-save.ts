import "server-only";

import { shouldBlockOgProjectDbWrite } from "@/lib/og-incident-guard";
import { OG_SYNC_INCIDENT_PAUSED } from "@/lib/og-sync-incident-pause";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  fetchProjectForOgSync,
  syncPublicProjectOgImage,
} from "@/lib/supabase/project-og-sync";

/** Server-only — generates/uploads Storage OGP after public project save. */
export async function syncProjectOgAfterPublicSave(
  projectId: string,
): Promise<void> {
  if (OG_SYNC_INCIDENT_PAUSED || shouldBlockOgProjectDbWrite("syncProjectOgAfterPublicSave")) {
    return;
  }

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
