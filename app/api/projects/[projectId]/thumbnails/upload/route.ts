import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  MAX_PROJECT_THUMBNAIL_UPLOAD_BYTES,
  PROJECT_THUMBNAILS_BUCKET,
  extensionForThumbnailMime,
  isHttpsThumbnailUrl,
  isValidThumbnailUploadIndex,
  sha256Hex,
  sniffThumbnailImageMime,
} from "@/lib/project-thumbnail-upload-rules";
import { publicObjectUrl } from "@/lib/supabase/project-thumbnail-storage";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Authenticated owner upload to project-thumbnails via service role only.
 * Clients cannot choose bucket/path; server derives `{projectId}/{index}-{hash}.{ext}`.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await context.params;
  if (!projectId || !UUID_RE.test(projectId)) {
    return NextResponse.json({ error: "invalid projectId" }, { status: 400 });
  }

  // Reject client-supplied bucket/path overrides if somehow posted
  const contentTypeHeader = request.headers.get("content-type") || "";
  if (!contentTypeHeader.includes("multipart/form-data")) {
    return NextResponse.json({ error: "multipart required" }, { status: 400 });
  }

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "supabase unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, owner_id")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    return NextResponse.json({ error: "lookup failed" }, { status: 502 });
  }
  if (!project) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (project.owner_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  if (form.get("bucket") || form.get("path") || form.get("objectPath")) {
    return NextResponse.json({ error: "path override forbidden" }, { status: 400 });
  }

  const file = form.get("file");
  const indexRaw = form.get("index");
  const index = Number(indexRaw);
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  if (!isValidThumbnailUploadIndex(index)) {
    return NextResponse.json({ error: "invalid index" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_PROJECT_THUMBNAIL_UPLOAD_BYTES) {
    return NextResponse.json({ error: "invalid file size" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniffThumbnailImageMime(bytes);
  if (!sniffed) {
    return NextResponse.json(
      { error: "unsupported or non-image file" },
      { status: 400 },
    );
  }

  const hash = (await sha256Hex(bytes)).slice(0, 16);
  const objectPath = `${projectId}/${index}-${hash}.${extensionForThumbnailMime(sniffed)}`;

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json(
      { error: "service role unavailable" },
      { status: 503 },
    );
  }

  const { error: uploadError } = await admin.storage
    .from(PROJECT_THUMBNAILS_BUCKET)
    .upload(objectPath, bytes, {
      contentType: sniffed,
      upsert: true,
      cacheControl: "3600",
    });
  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message || "upload failed" },
      { status: 502 },
    );
  }

  const publicUrl = publicObjectUrl(admin, objectPath);
  if (!isHttpsThumbnailUrl(publicUrl)) {
    return NextResponse.json({ error: "invalid public url" }, { status: 502 });
  }

  return NextResponse.json({ url: publicUrl });
}
