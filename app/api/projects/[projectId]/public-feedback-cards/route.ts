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
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "サービスが準備中です。" },
      { status: 503 },
    );
  }

  const project = await loadPublicProjectContext(supabase, projectId);
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

  const [cards, availableVersions] = await Promise.all([
    fetchPublicFeedbackCardsEnriched(supabase, project.projectId, {
      versionKey,
      limit,
    }),
    listPublicFeedbackVersionKeys(supabase, project.projectId),
  ]);

  return NextResponse.json({
    ok: true,
    cards,
    playableVersion,
    availableVersions,
  });
}
