import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  MAX_PROFILE_AVATAR_STORED_BYTES,
  PROFILE_AVATAR_STORAGE_BUCKET,
  extensionForAvatarMime,
  isHttpsAvatarUrl,
  isManagedProfileAvatarObjectPath,
  profileAvatarObjectPath,
  sniffAvatarImageMime,
} from "@/lib/profile-avatar-upload-rules";
import { publicProfileAvatarUrl } from "@/lib/supabase/profile-avatar-storage";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

async function sha256Hex16(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes);
  const digest = await crypto.subtle.digest("SHA-256", copy);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

/**
 * Authenticated user upload for profile avatar.
 * Writes via service role into project-thumbnails / profile-avatars/{userId}/…
 * (same public-read bucket as thumbnails; no new Production Storage policy).
 */
export async function POST(request: Request) {
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

  const form = await request.formData();
  if (form.get("bucket") || form.get("path") || form.get("objectPath")) {
    return NextResponse.json({ error: "path override forbidden" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_PROFILE_AVATAR_STORED_BYTES) {
    return NextResponse.json({ error: "invalid file size" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniffAvatarImageMime(bytes);
  if (!sniffed) {
    return NextResponse.json(
      { error: "unsupported or non-image file" },
      { status: 400 },
    );
  }

  const hash = await sha256Hex16(bytes);
  const objectPath = profileAvatarObjectPath(
    user.id,
    hash,
    extensionForAvatarMime(sniffed),
  );

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json(
      { error: "service role unavailable" },
      { status: 503 },
    );
  }

  const { error: uploadError } = await admin.storage
    .from(PROFILE_AVATAR_STORAGE_BUCKET)
    .upload(objectPath, bytes, {
      contentType: sniffed,
      upsert: true,
      cacheControl: "3600",
    });
  if (uploadError) {
    console.error("[profile-avatar-upload]", {
      userId: user.id,
      objectPath,
      message: uploadError.message,
    });
    return NextResponse.json(
      { error: uploadError.message || "upload failed" },
      { status: 502 },
    );
  }

  const publicUrl = publicProfileAvatarUrl(admin, objectPath);
  if (!isHttpsAvatarUrl(publicUrl)) {
    return NextResponse.json({ error: "invalid public url" }, { status: 502 });
  }

  return NextResponse.json({ url: publicUrl, objectPath });
}

/**
 * Best-effort cleanup of a just-uploaded avatar object owned by the caller.
 * Used when DB save fails after Storage upload.
 */
export async function DELETE(request: Request) {
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

  let body: { objectPath?: string } = {};
  try {
    body = (await request.json()) as { objectPath?: string };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const objectPath = (body.objectPath ?? "").trim();
  if (!isManagedProfileAvatarObjectPath(objectPath)) {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }
  if (!objectPath.startsWith(`profile-avatars/${user.id}/`)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json(
      { error: "service role unavailable" },
      { status: 503 },
    );
  }

  const { error } = await admin.storage
    .from(PROFILE_AVATAR_STORAGE_BUCKET)
    .remove([objectPath]);
  if (error) {
    console.error("[profile-avatar-cleanup]", {
      userId: user.id,
      objectPath,
      message: error.message,
    });
    return NextResponse.json({ error: "cleanup failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
