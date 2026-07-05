import { NextResponse, type NextRequest } from "next/server";
import { resolveSafeAuthNextPath } from "@/lib/auth-redirect";
import { syncUserXProfileAfterAuth } from "@/lib/sync-user-x-profile";
import { createClient } from "@/lib/supabase/server";

function withQuery(path: string, params: Record<string, string>): string {
  const [pathname, existingQuery = ""] = path.split("?");
  const searchParams = new URLSearchParams(existingQuery);
  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, value);
  }
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = resolveSafeAuthNextPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback`);
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback`);
  }

  const syncResult = await syncUserXProfileAfterAuth(supabase);
  if (!syncResult.ok) {
    if (syncResult.code === "x_account_already_linked") {
      return NextResponse.redirect(
        `${origin}${withQuery("/settings", { x: "error", reason: "already_linked" })}`,
      );
    }

    if (syncResult.code === "sync_failed" && next.startsWith("/settings")) {
      return NextResponse.redirect(
        `${origin}${withQuery(next, { x: "error", reason: "sync_failed" })}`,
      );
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
