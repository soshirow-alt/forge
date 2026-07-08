import { NextResponse } from "next/server";
import { parseOgDataUrlImage } from "@/lib/og-data-url-image";
import { resolveProjectPrimaryThumbnail } from "@/lib/project-thumbnails";
import { isSupabaseProjectId } from "@/lib/submitted-game-v0-adapter";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

/**
 * Public thumbnail proxy for social crawlers (X / OG).
 * Serves data:image thumbnails stored on public projects as real image responses.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { projectId } = await context.params;

  if (!isSupabaseProjectId(projectId)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return new NextResponse("Service unavailable", { status: 503 });
  }

  const { data, error } = await supabase
    .from("projects")
    .select("thumbnail_url, thumbnail_urls, visibility")
    .eq("id", projectId)
    .eq("visibility", "public")
    .maybeSingle();

  if (error || !data) {
    return new NextResponse("Not found", { status: 404 });
  }

  const thumbnail = resolveProjectPrimaryThumbnail(data);
  const parsed = parseOgDataUrlImage(thumbnail);
  if (!parsed) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(Buffer.from(parsed.bytes), {
    status: 200,
    headers: {
      "Content-Type": parsed.contentType,
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      "Content-Disposition": "inline",
    },
  });
}
