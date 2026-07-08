import { NextResponse } from "next/server";
import {
  OG_PIPELINE_PAUSE_REASON,
  OG_PIPELINE_PAUSED,
} from "@/lib/og-incident-guard";
import { isSupabaseProjectId } from "@/lib/submitted-game-v0-adapter";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

function pausedResponse() {
  return NextResponse.json(
    { ok: false, paused: true, reason: OG_PIPELINE_PAUSE_REASON },
    { status: 503 },
  );
}

/** Prewarm / lazy backfill — paused during thumbnail incident. */
export async function GET(_request: Request, context: RouteContext) {
  if (OG_PIPELINE_PAUSED) {
    return pausedResponse();
  }

  const { projectId } = await context.params;

  if (!isSupabaseProjectId(projectId)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  return NextResponse.json({ ok: false, reason: "og-sync not available" }, { status: 503 });
}

/** Save-time sync — paused during thumbnail incident. */
export async function POST(_request: Request, context: RouteContext) {
  if (OG_PIPELINE_PAUSED) {
    return pausedResponse();
  }

  return NextResponse.json({ ok: false, reason: "og-sync not available" }, { status: 503 });
}
