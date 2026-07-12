import { NextResponse } from "next/server";
import {
  publicThumbnailResponseHeaders,
  resolvePublicProjectThumbnail,
} from "@/lib/public-project-thumbnail-serve";
import { isSupabaseProjectId } from "@/lib/submitted-game-v0-adapter";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string; imageIndex: string }>;
};

function notFound(): NextResponse {
  return new NextResponse(null, { status: 404 });
}

/**
 * Path-based gallery index (next/image rejects ?query on local optimizer URLs).
 * Example: /api/public/projects/{id}/thumbnail/3
 */
export async function GET(_request: Request, context: RouteContext) {
  const { projectId, imageIndex } = await context.params;
  if (!isSupabaseProjectId(projectId) || !/^(0|[1-9]\d*)$/.test(imageIndex)) {
    return notFound();
  }

  const index = Number(imageIndex);
  if (!Number.isSafeInteger(index) || index < 0 || index > 99) {
    return notFound();
  }

  const supabase = await createClient();
  if (!supabase) {
    return notFound();
  }

  const resolved = await resolvePublicProjectThumbnail(
    supabase,
    projectId,
    index,
  );
  if (resolved.kind === "redirect") {
    return NextResponse.redirect(resolved.url, 302);
  }
  if (resolved.kind === "missing") {
    return notFound();
  }

  return new NextResponse(Buffer.from(resolved.bytes), {
    status: 200,
    headers: publicThumbnailResponseHeaders(resolved.contentType),
  });
}
