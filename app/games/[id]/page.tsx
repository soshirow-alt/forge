import type { Metadata } from "next";
import { GameDetailV0Page } from "@/components/game-detail-v0-page";
import {
  buildFallbackGameDetailMetadata,
  buildGameDetailMetadata,
} from "@/lib/game-detail-metadata";
import { isSupabaseProjectId } from "@/lib/submitted-game-v0-adapter";
import { createClient } from "@/lib/supabase/server";
import { fetchPublicProjectForOg } from "@/lib/supabase/project-og";

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

    const project = await fetchPublicProjectForOg(supabase, id);
    if (!project) {
      return buildFallbackGameDetailMetadata();
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
