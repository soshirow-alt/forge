import { type NextRequest } from "next/server";
import {
  resolveOAuthCallbackDestination,
  resolveOAuthCallbackErrorPath,
  resolveSafeAuthNextPath,
} from "@/lib/auth-redirect";
import {
  readOAuthFlowCookies,
  redirectWithOAuthCookieClear,
} from "@/lib/oauth-flow-cookie";
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

function readOAuthState(request: NextRequest) {
  const fromCookies = readOAuthFlowCookies((name) => request.cookies.get(name)?.value);

  if (fromCookies.flow) {
    return fromCookies;
  }

  // Email/password flows may still pass next via query (not Supabase OAuth redirectTo).
  const { searchParams } = new URL(request.url);
  return {
    flow: fromCookies.flow,
    next: resolveSafeAuthNextPath(searchParams.get("next")),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const { flow, next } = readOAuthState(request);

  if (!code) {
    return redirectWithOAuthCookieClear(
      `${origin}${resolveOAuthCallbackErrorPath(flow)}`,
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return redirectWithOAuthCookieClear(
      `${origin}${resolveOAuthCallbackErrorPath(flow)}`,
    );
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return redirectWithOAuthCookieClear(
      `${origin}${resolveOAuthCallbackErrorPath(flow)}`,
    );
  }

  const syncResult = await syncUserXProfileAfterAuth(supabase);
  if (!syncResult.ok) {
    if (syncResult.code === "x_account_already_linked") {
      return redirectWithOAuthCookieClear(
        `${origin}${withQuery("/settings", { x: "error", reason: "already_linked" })}`,
      );
    }

    if (syncResult.code === "sync_failed" && (flow === "x_link" || next.startsWith("/settings"))) {
      return redirectWithOAuthCookieClear(
        `${origin}${withQuery("/settings", { x: "error", reason: "sync_failed" })}`,
      );
    }
  }

  const destination = resolveOAuthCallbackDestination({ flow, next });
  return redirectWithOAuthCookieClear(`${origin}${destination}`);
}
