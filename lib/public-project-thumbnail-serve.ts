import { parseOgDataUrlImage } from "@/lib/og-data-url-image";
import {
  MAX_PUBLIC_PROJECT_THUMBNAIL_BYTES,
  PUBLIC_PROJECT_THUMBNAIL_CACHE_CONTROL,
} from "@/lib/public-project-thumbnail";
import { isHttpOrHttpsUrl } from "@/lib/safe-http-thumbnail";
import { createServiceRoleReadClient } from "@/lib/supabase/service-role";

export type ResolvedPublicThumbnail =
  | { kind: "redirect"; url: string }
  | { kind: "bytes"; contentType: string; bytes: Uint8Array }
  | { kind: "missing" }
  | { kind: "unavailable"; message: string };

type ThumbnailValueRpcResult = {
  data: string | null;
  error: { message: string; code?: string } | null;
};

type ThumbnailValueRpcClient = {
  rpc(
    fn: "get_public_project_thumbnail_value",
    args: { p_project_id: string; p_index: number },
  ): PromiseLike<ThumbnailValueRpcResult>;
};

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

function resolveCandidate(candidate: string): ResolvedPublicThumbnail {
  const externalUrl = validExternalImageUrl(candidate);
  if (externalUrl) {
    return { kind: "redirect", url: externalUrl };
  }

  const parsed = parseOgDataUrlImage(
    candidate,
    MAX_PUBLIC_PROJECT_THUMBNAIL_BYTES,
  );
  if (!parsed) {
    return { kind: "missing" };
  }

  return {
    kind: "bytes",
    contentType: parsed.contentType,
    bytes: parsed.bytes,
  };
}

/**
 * Resolve one public thumbnail by index via lightweight RPC (no full array SELECT).
 * Requires migration 061. Does not fall back to selecting thumbnail_urls.
 */
export async function resolvePublicProjectThumbnail(
  projectId: string,
  index: number,
): Promise<ResolvedPublicThumbnail> {
  if (!Number.isInteger(index) || index < 0 || index > 99) {
    return { kind: "missing" };
  }

  const admin = createServiceRoleReadClient();
  if (!admin) {
    return {
      kind: "unavailable",
      message: "service role client unavailable for thumbnail RPC",
    };
  }

  const rpcClient = admin as unknown as ThumbnailValueRpcClient;
  const { data, error } = await rpcClient.rpc(
    "get_public_project_thumbnail_value",
    {
      p_project_id: projectId,
      p_index: index,
    },
  );

  if (error) {
    return {
      kind: "unavailable",
      message: error.message || "thumbnail value RPC failed",
    };
  }

  const candidate = typeof data === "string" ? data.trim() : "";
  if (!candidate) {
    return { kind: "missing" };
  }

  return resolveCandidate(candidate);
}

export function publicThumbnailResponseHeaders(contentType: string): HeadersInit {
  return {
    "Content-Type": contentType,
    "Content-Disposition": "inline",
    "Cache-Control": PUBLIC_PROJECT_THUMBNAIL_CACHE_CONTROL,
    "X-Content-Type-Options": "nosniff",
  };
}
