import { NextResponse } from "next/server";
import {
  assertPublicProject,
  loadPublicProjectContext,
} from "@/lib/guest-feedback/validation";
import { fetchProjectAuthorXUsername } from "@/lib/supabase/user-x-profiles-server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
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

  const xUsername = await fetchProjectAuthorXUsername(supabase, projectId);

  return NextResponse.json({
    ok: true,
    xUsername,
  });
}
