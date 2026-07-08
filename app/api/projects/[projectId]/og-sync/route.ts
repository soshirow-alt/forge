import { NextResponse } from "next/server";
import { isSupabaseProjectId } from "@/lib/submitted-game-v0-adapter";
import { ensurePublicProjectOgImage } from "@/lib/supabase/project-og-sync";
import { syncProjectOgAfterPublicSave } from "@/lib/server/sync-project-og-after-save";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

/** Prewarm / lazy backfill — generates Storage OGP card if missing. */
export async function GET(_request: Request, context: RouteContext) {
  const { projectId } = await context.params;

  if (!isSupabaseProjectId(projectId)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const service = createServiceRoleClient();
  if (!service) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const url = await ensurePublicProjectOgImage(service, projectId);
  if (!url) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  return NextResponse.json({ ok: true, url });
}

/** Save-time sync — regenerates Storage OGP after public project updates. */
export async function POST(_request: Request, context: RouteContext) {
  const { projectId } = await context.params;

  if (!isSupabaseProjectId(projectId)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  await syncProjectOgAfterPublicSave(projectId);
  return NextResponse.json({ ok: true });
}
