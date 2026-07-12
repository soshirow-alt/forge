import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  MAX_PROJECT_THUMBNAIL_UPLOAD_BYTES,
  PROJECT_THUMBNAILS_BUCKET,
  isHttpsThumbnailUrl,
  publicObjectUrl,
  sha256Hex,
} from "@/lib/supabase/project-thumbnail-storage";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

function extensionForMime(mime: string): string {
  const normalized = mime.toLowerCase();
  if (normalized === "image/png") return "png";
  if (normalized === "image/webp") return "webp";
  if (normalized === "image/gif") return "gif";
  return "jpg";
}

function normalizeMime(mime: string | null | undefined): string {
  const raw = (mime ?? "").trim().toLowerCase().split(";")[0]?.trim() ?? "";
  if (raw === "image/png" || raw === "image/webp" || raw === "image/gif") {
    return raw;
  }
  if (raw === "image/jpeg" || raw === "image/jpg") {
    return "image/jpeg";
  }
  return "";
}

/**
 * Authenticated owner upload to project-thumbnails (service role write).
 * Staging can use this before Storage RLS policies are applied via Dashboard SQL.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await context.params;
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
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
  if (projectError || !project || project.owner_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const indexRaw = form.get("index");
  const index = Number(indexRaw);
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  if (!Number.isInteger(index) || index < 0 || index > 99) {
    return NextResponse.json({ error: "invalid index" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_PROJECT_THUMBNAIL_UPLOAD_BYTES) {
    return NextResponse.json({ error: "invalid file size" }, { status: 400 });
  }

  const contentType = normalizeMime(file.type);
  if (!contentType) {
    return NextResponse.json({ error: "unsupported mime" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const hash = (await sha256Hex(bytes)).slice(0, 16);
  const objectPath = `${projectId}/${index}-${hash}.${extensionForMime(contentType)}`;

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
      contentType,
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

  return NextResponse.json({ url: publicUrl, path: objectPath });
}
