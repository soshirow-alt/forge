import { NextResponse } from "next/server";
import {
  OG_SYNC_INCIDENT_MESSAGE,
  OG_SYNC_INCIDENT_PAUSED,
} from "@/lib/og-sync-incident-pause";
import { shouldBlockOgProjectDbWrite } from "@/lib/og-incident-guard";
import { isSupabaseProjectId } from "@/lib/submitted-game-v0-adapter";
import { ensurePublicProjectOgImage } from "@/lib/supabase/project-og-sync";
import { syncProjectOgAfterPublicSave } from "@/lib/server/sync-project-og-after-save";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

function pausedResponse() {
  return NextResponse.json(
    { ok: false, paused: true, reason: OG_SYNC_INCIDENT_MESSAGE },
    { status: 503 },
  );
}

/** Prewarm / lazy backfill — paused during thumbnail incident. */
export async function GET(_request: Request, context: RouteContext) {
  if (OG_SYNC_INCIDENT_PAUSED || shouldBlockOgProjectDbWrite("og-sync GET")) {
    return pausedResponse();
  }

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

/** Save-time sync — paused during thumbnail incident. */
export async function POST(_request: Request, context: RouteContext) {
  if (OG_SYNC_INCIDENT_PAUSED || shouldBlockOgProjectDbWrite("og-sync POST")) {
    return pausedResponse();
  }

  const { projectId } = await context.params;

  if (!isSupabaseProjectId(projectId)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  await syncProjectOgAfterPublicSave(projectId);
  return NextResponse.json({ ok: true });
}
