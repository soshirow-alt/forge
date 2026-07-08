import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";
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
  if (project.visibility !== "public") {
    return null;
  }

  const thumbs = await normalizeProjectThumbnailsInStorage(
    supabase,
    project.id,
    project.thumbnail_url,
    project.thumbnail_urls,
  );

  if (
    thumbs.thumbnail_url !== project.thumbnail_url ||
    JSON.stringify(thumbs.thumbnail_urls) !==
      JSON.stringify(project.thumbnail_urls ?? [])
  ) {
    await supabase
      .from("projects")
      .update({
        thumbnail_url: thumbs.thumbnail_url,
        thumbnail_urls: thumbs.thumbnail_urls,
      })
      .eq("id", project.id);
  }

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

  const { error } = await supabase
    .from("projects")
    .update({ og_image_url: publicUrl })
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
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, title, visibility, thumbnail_url, thumbnail_urls, og_image_url",
    )
    .eq("id", projectId)
    .eq("visibility", "public")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as OgSyncInput;
}

export async function ensurePublicProjectOgImage(
  supabase: SupabaseClient,
  projectId: string,
): Promise<string | null> {
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
