import { NextResponse, type NextRequest } from "next/server";
import {
  resolveOAuthCallbackDestination,
  resolveSafeAuthNextPath,
} from "@/lib/auth-redirect";
import {
  logOAuthCallbackStep,
  loginAuthErrorPath,
  mapExchangeErrorMessage,
  normalizeOAuthFailureReason,
  settingsXErrorPath,
  type OAuthCallbackFailReason,
} from "@/lib/oauth-callback-errors";
import {
  readOAuthFlowCookies,
  clearOAuthFlowCookies,
} from "@/lib/oauth-flow-cookie";
import { syncUserXProfileAfterAuth } from "@/lib/sync-user-x-profile";
import {
  createRouteHandlerSupabase,
  redirectWithSupabaseCookies,
} from "@/lib/supabase/route-handler";

function finalizeRedirect(
  targetUrl: string,
  cookieResponse: () => NextResponse,
) {
  const redirect = redirectWithSupabaseCookies(targetUrl, cookieResponse());
  clearOAuthFlowCookies(redirect);
  return redirect;
}

function xLinkErrorRedirect(
  origin: string,
  reason: OAuthCallbackFailReason,
  cookieResponse: () => NextResponse,
) {
  return finalizeRedirect(`${origin}${settingsXErrorPath(reason)}`, cookieResponse);
}

function xLoginErrorRedirect(
  origin: string,
  reason: OAuthCallbackFailReason,
  cookieResponse: () => NextResponse,
) {
  return finalizeRedirect(`${origin}${loginAuthErrorPath(reason)}`, cookieResponse);
}

function readOAuthState(request: NextRequest) {
  const fromCookies = readOAuthFlowCookies((name) => request.cookies.get(name)?.value);
  const { searchParams } = new URL(request.url);

  return {
    flow: fromCookies.flow,
    next: fromCookies.flow
      ? fromCookies.next
      : resolveSafeAuthNextPath(searchParams.get("next")),
    hasFlowCookie: Boolean(fromCookies.flow),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthErrorCode = searchParams.get("error_code");
  const oauthErrorDescription = searchParams.get("error_description");
  const { flow, next, hasFlowCookie } = readOAuthState(request);

  const routeSupabase = createRouteHandlerSupabase(request);
  if (!routeSupabase) {
    logOAuthCallbackStep("supabase_not_configured", { flow: flow ?? "none" });
    const reason: OAuthCallbackFailReason = "callback_failed";
    const target =
      flow === "x_link"
        ? `${origin}${settingsXErrorPath(reason)}`
        : `${origin}${loginAuthErrorPath(reason)}`;
    return NextResponse.redirect(target);
  }

  const { supabase, cookieResponse } = routeSupabase;

  logOAuthCallbackStep("start", {
    flow: flow ?? "none",
    hasFlowCookie,
    hasCode: Boolean(code),
    oauthError: oauthError ?? "none",
  });

  if (oauthError || oauthErrorCode) {
    const reason =
      normalizeOAuthFailureReason({
        error: oauthError,
        errorCode: oauthErrorCode,
        errorDescription: oauthErrorDescription,
      }) ?? "oauth_provider_error";
    logOAuthCallbackStep("oauth_provider_error", {
      flow: flow ?? "none",
      oauthError: oauthError ?? "none",
      oauthErrorCode: oauthErrorCode ?? "none",
      detail: oauthErrorDescription?.slice(0, 200) ?? null,
      reason,
    });
    if (flow === "x_link") {
      return xLinkErrorRedirect(origin, reason, cookieResponse);
    }
    return xLoginErrorRedirect(origin, reason, cookieResponse);
  }

  if (!code) {
    logOAuthCallbackStep("missing_code", { flow: flow ?? "none", hasFlowCookie });
    if (flow === "x_link") {
      return xLinkErrorRedirect(
        origin,
        hasFlowCookie ? "missing_code" : "missing_oauth_flow_cookie",
        cookieResponse,
      );
    }
    return xLoginErrorRedirect(origin, "missing_code", cookieResponse);
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    logOAuthCallbackStep("exchange_failed", {
      flow: flow ?? "none",
      detail: exchangeError.message.slice(0, 200),
    });
    const reason = mapExchangeErrorMessage(
      exchangeError.message,
      exchangeError.code,
    );
    if (flow === "x_link") {
      return xLinkErrorRedirect(origin, reason, cookieResponse);
    }
    return xLoginErrorRedirect(origin, reason, cookieResponse);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    logOAuthCallbackStep("missing_user_after_exchange", {
      flow: flow ?? "none",
      detail: userError?.message?.slice(0, 200) ?? null,
    });
    if (flow === "x_link") {
      return xLinkErrorRedirect(origin, "missing_user", cookieResponse);
    }
    return xLoginErrorRedirect(origin, "missing_user", cookieResponse);
  }

  const identityProviders = (user.identities ?? [])
    .map((identity) => identity.provider)
    .join(",");

  logOAuthCallbackStep("session_ready", {
    flow: flow ?? "none",
    userId: user.id,
    identityProviders: identityProviders || "none",
    hasXIdentity:
      identityProviders.includes("twitter") || identityProviders.includes("x"),
  });

  const hasXIdentity = (user.identities ?? []).some(
    (identity) => identity.provider === "x" || identity.provider === "twitter",
  );

  const syncResult = await syncUserXProfileAfterAuth(supabase, {
    requireXIdentity: flow === "x_link",
    syncIfXIdentityPresent: flow === "x_login" && hasXIdentity,
  });

  if (!syncResult.ok) {
    logOAuthCallbackStep("sync_failed", {
      flow: flow ?? "none",
      code: syncResult.code,
      detail: syncResult.detail?.slice(0, 200) ?? null,
    });
    if (flow === "x_link" || next.startsWith("/settings")) {
      return xLinkErrorRedirect(origin, syncResult.code, cookieResponse);
    }
    if (syncResult.code === "x_account_already_linked") {
      return xLinkErrorRedirect(origin, syncResult.code, cookieResponse);
    }
  }

  if (flow === "x_link" && syncResult.ok && !syncResult.synced) {
    logOAuthCallbackStep("missing_x_identity_after_link", {
      flow: flow ?? "none",
      identityProviders,
    });
    return xLinkErrorRedirect(origin, "missing_x_identity", cookieResponse);
  }

  const destination = resolveOAuthCallbackDestination({ flow, next });
  logOAuthCallbackStep("success", { flow: flow ?? "none", destination });
  return finalizeRedirect(`${origin}${destination}`, cookieResponse);
}
