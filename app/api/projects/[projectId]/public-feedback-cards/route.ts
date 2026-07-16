import { NextResponse } from "next/server";
import {
  assertPublicProject,
  loadPublicProjectContext,
} from "@/lib/guest-feedback/validation";
import { resolvePlayableVersion } from "@/lib/playable-version";
import {
  fetchPublicFeedbackCardsEnriched,
  listPublicFeedbackVersionKeys,
} from "@/lib/supabase/public-feedback-cards-server";
import { createClient as createServerUserClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const service = createServiceRoleClient();
  const viewer = await createServerUserClient();
  if (!service || !viewer) {
    return NextResponse.json(
      { ok: false, message: "サービスが準備中です。" },
      { status: 503 },
    );
  }

  const project = await loadPublicProjectContext(service, projectId);
  if (!project) {
    return NextResponse.json(
      { ok: false, message: "作品が見つかりません。" },
      { status: 404 },
    );
  }
  if (!assertPublicProject(project)) {
    return NextResponse.json(
      { ok: false, message: "この作品は公開されていません。" },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const versionParam = url.searchParams.get("version")?.trim();
  const limitParam = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
  const limit = Number.isFinite(limitParam) ? limitParam : 50;

  const playableVersion = resolvePlayableVersion(project.playableVersion);
  const versionKey =
    versionParam === "all"
      ? "all"
      : versionParam
        ? resolvePlayableVersion(versionParam)
        : playableVersion;

  // Viewer session for RPC auth.uid() flags; service role for enrichment RPCs.
  const [cardsResult, availableVersions] = await Promise.all([
    fetchPublicFeedbackCardsEnriched(viewer, project.projectId, {
      versionKey,
      limit,
      enrichSupabase: service,
    }),
    listPublicFeedbackVersionKeys(service, project.projectId),
  ]);

  return NextResponse.json(
    {
      ok: true,
      cards: cardsResult.cards,
      participantCount: cardsResult.participantCount,
      playableVersion,
      availableVersions,
    },
    {
      headers: {
        // Viewer-specific empathy/reply flags — never cache across users.
        "Cache-Control": "private, no-store, max-age=0",
      },
    },
  );
}
