import { NextResponse } from "next/server";
import { fetchCreatorRouteXUsername } from "@/lib/supabase/user-x-profiles-server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ routeId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { routeId } = await context.params;
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "サービスが準備中です。" },
      { status: 503 },
    );
  }

  const xUsername = await fetchCreatorRouteXUsername(supabase, routeId);

  return NextResponse.json({
    ok: true,
    xUsername,
  });
}
