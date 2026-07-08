import "server-only";

import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";
import { OG_SYNC_INCIDENT_PAUSED } from "@/lib/og-sync-incident-pause";
import {
  filterOgProjectDbWritePayload,
  shouldBlockOgProjectDbWrite,
} from "@/lib/og-incident-guard";
import { parseOgDataUrlImage } from "@/lib/og-data-url-image";
import {
  generateProjectOgJpeg,
  generateProjectOgJpegWithoutThumb,
} from "@/lib/project-og-image-generate";
import { resolveProjectPrimaryThumbnail } from "@/lib/project-thumbnails";
import {
  PROJECT_OG_BUCKET,
  PROJECT_THUMBNAILS_BUCKET,
  projectOgObjectPath,
  projectThumbnailObjectPath,
  uploadPublicObject,
} from "@/lib/supabase/project-media-storage";

const MAX_THUMB_FETCH_BYTES = 5 * 1024 * 1024;

async function loadImageBytes(candidate: string): Promise<Buffer | null> {
  const trimmed = candidate.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = parseOgDataUrlImage(trimmed);
  if (parsed) {
    if (parsed.bytes.length > MAX_THUMB_FETCH_BYTES) {
      return null;
    }
    return Buffer.from(parsed.bytes);
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const response = await fetch(trimmed, {
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > MAX_THUMB_FETCH_BYTES) {
        return null;
      }
      return Buffer.from(arrayBuffer);
    } catch {
      return null;
    }
  }

  return null;
}

async function persistDataUrlThumbnail(
  supabase: SupabaseClient,
  projectId: string,
  dataUrl: string,
  index: number,
): Promise<string | null> {
  const bytes = await loadImageBytes(dataUrl);
  if (!bytes) {
    return null;
  }

  const jpeg = await sharp(bytes).rotate().jpeg({ quality: 86, mozjpeg: true }).toBuffer();

  return uploadPublicObject(
    supabase,
    PROJECT_THUMBNAILS_BUCKET,
    projectThumbnailObjectPath(projectId, index),
    jpeg,
    "image/jpeg",
  );
}

export async function normalizeProjectThumbnailsInStorage(
  supabase: SupabaseClient,
  projectId: string,
  thumbnailUrl: string | null,
  thumbnailUrls: string[] | null | undefined,
): Promise<{ thumbnail_url: string | null; thumbnail_urls: string[] }> {
  const sources =
    thumbnailUrls?.length
      ? thumbnailUrls
      : thumbnailUrl
        ? [thumbnailUrl]
        : [];

  const normalized: string[] = [];

  for (let index = 0; index < sources.length; index++) {
    const source = sources[index]?.trim() ?? "";
    if (!source) {
      continue;
    }

    if (parseOgDataUrlImage(source)) {
      const uploaded = await persistDataUrlThumbnail(
        supabase,
        projectId,
        source,
        index,
      );
      if (uploaded) {
        normalized.push(uploaded);
      }
      continue;
    }

    if (/^https?:\/\//i.test(source)) {
      normalized.push(source);
    }
  }

  return {
    thumbnail_url: normalized[0] ?? null,
    thumbnail_urls: normalized,
  };
}

export type OgSyncInput = {
  id: string;
  title: string;
  visibility: "public" | "private";
  thumbnail_url: string | null;
  thumbnail_urls?: string[] | null;
  og_image_url?: string | null;
};

/**
 * Generate 1200×630 JPEG, upload to Storage, persist og_image_url (+ thumbnails if data:).
 * Returns public Storage URL or null on failure.
 */
export async function syncPublicProjectOgImage(
  supabase: SupabaseClient,
  project: OgSyncInput,
): Promise<string | null> {
  if (OG_SYNC_INCIDENT_PAUSED) {
    return null;
  }

  if (project.visibility !== "public") {
    return null;
  }

  const thumbs = await normalizeProjectThumbnailsInStorage(
    supabase,
    project.id,
    project.thumbnail_url,
    project.thumbnail_urls,
  );

  // OGP must never mutate thumbnail_url / thumbnail_urls (incident 2026-07-09).

  const primary =
    thumbs.thumbnail_url ??
    resolveProjectPrimaryThumbnail({
      thumbnail_url: project.thumbnail_url,
      thumbnail_urls: project.thumbnail_urls,
    }) ??
    null;

  let jpeg: Buffer;
  try {
    const sourceBytes = primary ? await loadImageBytes(primary) : null;
    jpeg = sourceBytes
      ? await generateProjectOgJpeg(project.title, sourceBytes)
      : await generateProjectOgJpegWithoutThumb(project.title);
  } catch (error) {
    console.error("[project-og-sync] generate failed", project.id, error);
    return null;
  }

  const publicUrl = await uploadPublicObject(
    supabase,
    PROJECT_OG_BUCKET,
    projectOgObjectPath(project.id),
    jpeg,
    "image/jpeg",
  );

  if (!publicUrl) {
    return null;
  }

  if (shouldBlockOgProjectDbWrite("syncPublicProjectOgImage")) {
    return publicUrl;
  }

  const updatePayload = filterOgProjectDbWritePayload(
    { og_image_url: publicUrl },
    "syncPublicProjectOgImage",
  );
  if (!("og_image_url" in updatePayload)) {
    return publicUrl;
  }

  const { error } = await supabase
    .from("projects")
    .update(updatePayload)
    .eq("id", project.id);

  if (error) {
    console.error("[project-og-sync] og_image_url update failed", project.id, error.message);
    return publicUrl;
  }

  return publicUrl;
}

export async function fetchProjectForOgSync(
  supabase: SupabaseClient,
  projectId: string,
): Promise<OgSyncInput | null> {
  const fullSelect =
    "id, title, visibility, thumbnail_url, thumbnail_urls, og_image_url";
  const baseSelect = "id, title, visibility, thumbnail_url, thumbnail_urls";

  const first = await supabase
    .from("projects")
    .select(fullSelect)
    .eq("id", projectId)
    .eq("visibility", "public")
    .maybeSingle();

  if (!first.error && first.data) {
    return first.data as OgSyncInput;
  }

  if (
    first.error?.message?.includes("og_image_url") ||
    first.error?.message?.includes("does not exist")
  ) {
    const fallback = await supabase
      .from("projects")
      .select(baseSelect)
      .eq("id", projectId)
      .eq("visibility", "public")
      .maybeSingle();
    if (fallback.error || !fallback.data) {
      return null;
    }
    return { ...(fallback.data as OgSyncInput), og_image_url: null };
  }

  return null;
}

export async function ensurePublicProjectOgImage(
  supabase: SupabaseClient,
  projectId: string,
): Promise<string | null> {
  if (OG_SYNC_INCIDENT_PAUSED) {
    return null;
  }

  const project = await fetchProjectForOgSync(supabase, projectId);
  if (!project) {
    return null;
  }

  const existing = project.og_image_url?.trim();
  if (existing && /^https?:\/\//i.test(existing)) {
    return existing;
  }

  return syncPublicProjectOgImage(supabase, project);
}
