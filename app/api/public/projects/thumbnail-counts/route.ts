import { NextResponse } from "next/server";
import { isSupabaseProjectId } from "@/lib/submitted-game-v0-adapter";
import { fetchPublicProjectThumbnailCount } from "@/lib/supabase/projects";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Featured home hero: at most 3 projects. */
const MAX_HERO_IDS = 3;

/**
 * Lightweight counts for featured hero extras.
 * Does not return thumbnail bodies — integers only.
 * GET /api/public/projects/thumbnail-counts?ids=uuid,uuid
 */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("ids") ?? "";
  const ids = [
    ...new Set(
      raw
        .split(",")
        .map((id) => id.trim())
        .filter((id) => isSupabaseProjectId(id)),
    ),
  ].slice(0, MAX_HERO_IDS);

  if (ids.length === 0) {
    return NextResponse.json({ ok: true, counts: {} as Record<string, number> });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "supabase unavailable" },
      { status: 503 },
    );
  }

  const counts: Record<string, number> = {};
  await Promise.all(
    ids.map(async (projectId) => {
      counts[projectId] = await fetchPublicProjectThumbnailCount(
        supabase,
        projectId,
      );
    }),
  );

  return NextResponse.json({ ok: true, counts });
}
