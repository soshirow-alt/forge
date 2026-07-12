import { NextResponse } from "next/server";
import { parseOgDataUrlImage } from "@/lib/og-data-url-image";
import { resolveProjectThumbnailUrlsFromRow } from "@/lib/project-thumbnails";
import {
  MAX_PUBLIC_PROJECT_THUMBNAIL_BYTES,
  PUBLIC_PROJECT_THUMBNAIL_CACHE_CONTROL,
} from "@/lib/public-project-thumbnail";
import { isHttpOrHttpsUrl } from "@/lib/safe-http-thumbnail";
import { isSupabaseProjectId } from "@/lib/submitted-game-v0-adapter";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

function notFound(): NextResponse {
  return new NextResponse(null, { status: 404 });
}

function parseThumbnailIndex(request: Request): number | null | undefined {
  const value = new URL(request.url).searchParams.get("index");
  if (value === null) return undefined;
  if (!/^(0|[1-9]\d*)$/.test(value)) return null;
  const index = Number(value);
  return Number.isSafeInteger(index) ? index : null;
}

function validExternalImageUrl(candidate: string): string | null {
  if (!isHttpOrHttpsUrl(candidate)) return null;
  try {
    const url = new URL(candidate.trim());
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const requestedIndex = parseThumbnailIndex(request);

  if (!isSupabaseProjectId(projectId) || requestedIndex === null) {
    return notFound();
  }

  const supabase = await createClient();
  if (!supabase) {
    return notFound();
  }

  const { data, error } = await supabase
    .from("projects")
    .select("thumbnail_url, thumbnail_urls, visibility")
    .eq("id", projectId)
    .eq("visibility", "public")
    .maybeSingle();

  if (error || !data) {
    return notFound();
  }

  const candidates = resolveProjectThumbnailUrlsFromRow(data);
  const selectedCandidates =
    requestedIndex === undefined
      ? candidates
      : candidates[requestedIndex]
        ? [candidates[requestedIndex]]
        : [];

  for (const candidate of selectedCandidates) {
    const externalUrl = validExternalImageUrl(candidate);
    if (externalUrl) {
      return NextResponse.redirect(externalUrl, 302);
    }

    const parsed = parseOgDataUrlImage(
      candidate,
      MAX_PUBLIC_PROJECT_THUMBNAIL_BYTES,
    );
    if (!parsed) continue;

    return new NextResponse(Buffer.from(parsed.bytes), {
      status: 200,
      headers: {
        "Content-Type": parsed.contentType,
        "Content-Disposition": "inline",
        "Cache-Control": PUBLIC_PROJECT_THUMBNAIL_CACHE_CONTROL,
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  return notFound();
}
