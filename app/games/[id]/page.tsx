import type { Metadata } from "next";
import { GameDetailV0Page } from "@/components/game-detail-v0-page";
import {
  buildFallbackGameDetailMetadata,
  buildGameDetailMetadata,
} from "@/lib/game-detail-metadata";
import { isSupabaseProjectId } from "@/lib/submitted-game-v0-adapter";
import { fetchPublicProjectForOg } from "@/lib/supabase/project-og";
import { ensurePublicProjectOgImage } from "@/lib/supabase/project-og-sync";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  if (!isSupabaseProjectId(id)) {
    return buildFallbackGameDetailMetadata();
  }

  try {
    const supabase = await createClient();
    if (!supabase) {
      return buildFallbackGameDetailMetadata();
    }

    let project = await fetchPublicProjectForOg(supabase, id);
    if (!project) {
      return buildFallbackGameDetailMetadata();
    }

    if (!project.ogImageUrl) {
      const service = createServiceRoleClient();
      if (service) {
        const synced = await ensurePublicProjectOgImage(service, id);
        if (synced) {
          project = { ...project, ogImageUrl: synced };
        }
      }
    }

    return buildGameDetailMetadata(project);
  } catch {
    return buildFallbackGameDetailMetadata();
  }
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <GameDetailV0Page id={id} />;
}
