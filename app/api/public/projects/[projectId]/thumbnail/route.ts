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

type PublicThumbnailPrimaryRow = {
  thumbnail_url: string | null;
  visibility: "public" | "private";
};

type PublicThumbnailFullRow = {
  thumbnail_url: string | null;
  thumbnail_urls: string[] | null;
  visibility: "public" | "private";
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

  // Prefer the primary column alone so we do not pull multi-MB thumbnail_urls
  // arrays on the common card path (index omitted / index 0).
  const needsUrlArray =
    requestedIndex !== undefined && requestedIndex > 0;

  let candidates: string[];

  if (needsUrlArray) {
    const { data, error } = await supabase
      .from("projects")
      .select("thumbnail_url, thumbnail_urls, visibility")
      .eq("id", projectId)
      .eq("visibility", "public")
      .maybeSingle();

    if (error || !data) {
      return notFound();
    }

    const row = data as PublicThumbnailFullRow;
    const all = resolveProjectThumbnailUrlsFromRow(row);
    candidates = all[requestedIndex!] ? [all[requestedIndex!]] : [];
  } else {
    const { data, error } = await supabase
      .from("projects")
      .select("thumbnail_url, visibility")
      .eq("id", projectId)
      .eq("visibility", "public")
      .maybeSingle();

    if (error || !data) {
      return notFound();
    }

    const row = data as PublicThumbnailPrimaryRow;
    const primary =
      typeof row.thumbnail_url === "string" ? row.thumbnail_url.trim() : "";

    if (primary) {
      candidates = [primary];
    } else {
      // Primary empty: one fallback fetch for array[0] only.
      const { data: full, error: fullError } = await supabase
        .from("projects")
        .select("thumbnail_url, thumbnail_urls, visibility")
        .eq("id", projectId)
        .eq("visibility", "public")
        .maybeSingle();
      if (fullError || !full) return notFound();
      const fromFull = resolveProjectThumbnailUrlsFromRow(
        full as PublicThumbnailFullRow,
      );
      candidates = fromFull[0] ? [fromFull[0]] : [];
    }
  }

  for (const candidate of candidates) {
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
