import { NextResponse } from "next/server";
import {
  publicThumbnailResponseHeaders,
  resolvePublicProjectThumbnail,
} from "@/lib/public-project-thumbnail-serve";
import { isSupabaseProjectId } from "@/lib/submitted-game-v0-adapter";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

function notFound(): NextResponse {
  return new NextResponse(null, { status: 404 });
}

function unavailable(message: string): NextResponse {
  return NextResponse.json(
    { ok: false, message },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

function parseLegacyIndex(request: Request): number {
  const value = new URL(request.url).searchParams.get("index");
  if (value === null) return 0;
  if (!/^(0|[1-9]\d*)$/.test(value)) return -1;
  const index = Number(value);
  return Number.isSafeInteger(index) ? index : -1;
}

/** Default cover / legacy ?index= (prefer path /thumbnail/{n} for next/image). */
export async function GET(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const index = parseLegacyIndex(request);
  if (!isSupabaseProjectId(projectId) || index < 0) {
    return notFound();
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
