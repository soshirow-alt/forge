import { NextResponse } from "next/server";
import {
  assertPublicProject,
  loadPublicProjectContext,
} from "@/lib/guest-feedback/validation";
import { resolvePlayableVersion } from "@/lib/playable-version";
import {
  countPublicFeedbackParticipantsByVersion,
  fetchPublicFeedbackCardsEnriched,
  listProjectFeedbackVersionKeys,
} from "@/lib/supabase/public-feedback-cards-server";
import { shouldIncludeGuestInPublicFeedbackCards } from "@/lib/public-feedback-include-guest";
import { fetchPublicVoiceAggregates } from "@/lib/supabase/voice-engagement";
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
        : "all";

  const availableVersions = await listProjectFeedbackVersionKeys(
    service,
    project.projectId,
    playableVersion,
  );
  const requestedVersions =
    versionKey === "all" ? availableVersions : [resolvePlayableVersion(versionKey)];

  const includeGuest = shouldIncludeGuestInPublicFeedbackCards();

  // One HTTP response supplies all filter states. RPCs stay viewer-scoped so
  // empathy/reply flags remain correct, while privileged reads are server-only.
  const [cardsResult, aggregateEntries, feedbackCounts] = await Promise.all([
    fetchPublicFeedbackCardsEnriched(viewer, project.projectId, {
      versionKey,
      limit,
      enrichSupabase: service,
    }),
    Promise.all(
      requestedVersions.map(async (version) => [
        version,
        await fetchPublicVoiceAggregates(service, project.projectId, version, {
          includeGuest,
        }),
      ] as const),
    ),
    countPublicFeedbackParticipantsByVersion(
      service,
      project.projectId,
      availableVersions,
    ),
  ]);

  return NextResponse.json(
    {
      ok: true,
      cards: cardsResult.cards,
      participantCount: feedbackCounts.all,
      playableVersion,
      availableVersions,
      versionCounts: feedbackCounts.byVersion,
      aggregatesByVersion: Object.fromEntries(aggregateEntries),
    },
    {
      headers: {
        // Viewer-specific empathy/reply flags — never cache across users.
        "Cache-Control": "private, no-store, max-age=0",
      },
    },
  );
}
