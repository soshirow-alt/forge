import type { SupabaseClient } from "@supabase/supabase-js";

export const PROJECT_OG_BUCKET = "project-og";
export const PROJECT_THUMBNAILS_BUCKET = "project-thumbnails";

export function buildStoragePublicUrl(
  supabaseUrl: string,
  bucket: string,
  objectPath: string,
): string {
  const base = supabaseUrl.replace(/\/$/, "");
  const encoded = objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${base}/storage/v1/object/public/${bucket}/${encoded}`;
}

export function projectOgObjectPath(projectId: string): string {
  return `${projectId}/card.jpg`;
}

export function projectThumbnailObjectPath(
  projectId: string,
  index: number,
): string {
  return `${projectId}/${index}.jpg`;
}

export async function uploadPublicObject(
  supabase: SupabaseClient,
  bucket: string,
  objectPath: string,
  body: Buffer,
  contentType: string,
): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    return null;
  }

  const { error } = await supabase.storage.from(bucket).upload(objectPath, body, {
    contentType,
    upsert: true,
    cacheControl: "public, max-age=31536000, immutable",
  });

  if (error) {
    console.error("[project-media-storage] upload failed", bucket, objectPath, error.message);
    return null;
  }

  return buildStoragePublicUrl(supabaseUrl, bucket, objectPath);
}
