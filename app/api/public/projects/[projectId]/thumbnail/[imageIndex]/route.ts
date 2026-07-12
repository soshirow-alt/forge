import { NextResponse } from "next/server";
import {
  publicThumbnailResponseHeaders,
  resolvePublicProjectThumbnail,
} from "@/lib/public-project-thumbnail-serve";
import { isSupabaseProjectId } from "@/lib/submitted-game-v0-adapter";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string; imageIndex: string }>;
};

function notFound(): NextResponse {
  return new NextResponse(null, { status: 404 });
}

function badRequest(): NextResponse {
  return new NextResponse(null, { status: 400 });
}

function unavailable(message: string): NextResponse {
  return NextResponse.json(
    { ok: false, message },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

/**
 * Path-based gallery index (next/image rejects ?query on local optimizer URLs).
 * Example: /api/public/projects/{id}/thumbnail/3
 */
export async function GET(_request: Request, context: RouteContext) {
  const { projectId, imageIndex } = await context.params;
  if (!isSupabaseProjectId(projectId)) {
    return notFound();
  }
  if (!/^(0|[1-9]\d*)$/.test(imageIndex)) {
    return badRequest();
  }

  const index = Number(imageIndex);
  if (!Number.isSafeInteger(index) || index < 0 || index > 99) {
    return badRequest();
  }

  const resolved = await resolvePublicProjectThumbnail(projectId, index);
  if (resolved.kind === "unavailable") {
    return unavailable(resolved.message);
  }
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
