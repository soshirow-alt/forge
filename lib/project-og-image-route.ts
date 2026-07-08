import { shouldBlockOgProjectDbWrite } from "@/lib/og-incident-guard";
import { isSupabaseProjectId } from "@/lib/submitted-game-v0-adapter";
import { ensurePublicProjectOgImage } from "@/lib/supabase/project-og-sync";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const OG_CACHE_HEADERS = {
  "Cache-Control":
    "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
  "Content-Disposition": "inline",
} as const;

/**
 * Ensures Storage JPEG exists, then returns image bytes (no redirect).
 * Never 500 — empty JPEG fallback on hard failure.
 */
export async function handleProjectOgImageGet(
  projectId: string,
): Promise<Response> {
  try {
    if (!isSupabaseProjectId(projectId)) {
      return emptyOgResponse();
    }

    const service = createServiceRoleClient();
    if (!service) {
      return emptyOgResponse();
    }

    if (shouldBlockOgProjectDbWrite("handleProjectOgImageGet")) {
      return emptyOgResponse();
    }

    const storageUrl = await ensurePublicProjectOgImage(service, projectId);
    if (!storageUrl) {
      return emptyOgResponse();
    }

    const imageResponse = await fetch(storageUrl, {
      signal: AbortSignal.timeout(20_000),
    });
    if (!imageResponse.ok) {
      return emptyOgResponse();
    }

    const bytes = await imageResponse.arrayBuffer();
    const contentType =
      imageResponse.headers.get("content-type")?.split(";")[0]?.trim() ||
      "image/jpeg";

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        ...OG_CACHE_HEADERS,
      },
    });
  } catch {
    return emptyOgResponse();
  }
}

function emptyOgResponse(): Response {
  const tinyJpeg = new Uint8Array(
    Buffer.from(
      "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGcP//Z",
      "base64",
    ),
  );
  return new Response(tinyJpeg, {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      ...OG_CACHE_HEADERS,
    },
  });
}
