import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { isHttpsThumbnailUrl } from "@/lib/project-thumbnail-upload-rules";
import { deriveAndUploadProjectOgImage } from "@/lib/supabase/project-og-derive";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Owner-only: derive 1200×630 OGP JPEG from primary thumbnail_url and set og_image_url.
 * Never mutates thumbnail_url / thumbnail_urls. On failure, leaves og_image_url unchanged.
 * Does not delete prior OG Storage objects (immutable path; cleanup is a separate process).
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await context.params;
  if (!projectId || !UUID_RE.test(projectId)) {
    return NextResponse.json({ error: "invalid projectId" }, { status: 400 });
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
    .select("id, owner_id, thumbnail_url, og_image_url")
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

  const sourceUrl =
    typeof project.thumbnail_url === "string" ? project.thumbnail_url.trim() : "";
  if (!isHttpsThumbnailUrl(sourceUrl)) {
    return NextResponse.json(
      { error: "primary thumbnail is not https" },
      { status: 400 },
    );
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json(
      { error: "service role unavailable" },
      { status: 503 },
    );
  }

  let derived;
  try {
    derived = await deriveAndUploadProjectOgImage(admin, projectId, sourceUrl);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "og derive failed",
      },
      { status: 502 },
    );
  }

  // DB update only after upload + binary verify succeeded. Prior og_* objects kept.
  const { error: updateError } = await admin
    .from("projects")
    .update({ og_image_url: derived.url })
    .eq("id", projectId);
  if (updateError) {
    return NextResponse.json(
      { error: updateError.message || "og_image_url update failed" },
      { status: 502 },
    );
  }

  revalidatePath(`/games/${projectId}`);

  return NextResponse.json({
    url: derived.url,
    width: derived.width,
    height: derived.height,
    contentType: derived.contentType,
    objectPath: derived.objectPath,
    sourceHash16: derived.sourceHash16,
    derivedJpegHash16: derived.derivedJpegHash16,
    reusedExistingObject: derived.reusedExistingObject,
  });
}
