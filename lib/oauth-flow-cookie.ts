import { NextResponse } from "next/server";
import { type OAuthFlow, resolveSafeAuthNextPath } from "@/lib/auth-redirect";

export const OAUTH_FLOW_COOKIE = "forge_oauth_flow";
export const OAUTH_NEXT_COOKIE = "forge_oauth_next";
export const OAUTH_COOKIE_MAX_AGE_SECONDS = 600;

export type OAuthFlowCookieState = {
  flow: OAuthFlow | null;
  next: string;
};

export function isOAuthFlow(value: string | null | undefined): value is OAuthFlow {
  return value === "x_login" || value === "x_link";
}

/** Set short-lived flow state before OAuth redirect (client only). */
export function setOAuthFlowCookies(flow: OAuthFlow, nextPath?: string | null): void {
  if (typeof document === "undefined") {
    throw new Error("OAuth flow cookies must be set in the browser.");
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const next = resolveSafeAuthNextPath(nextPath ?? null);
  const base = `; Max-Age=${OAUTH_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;

  document.cookie = `${OAUTH_FLOW_COOKIE}=${flow}${base}`;
  document.cookie = `${OAUTH_NEXT_COOKIE}=${encodeURIComponent(next)}${base}`;
}

export function readOAuthFlowCookies(
  getCookie: (name: string) => string | undefined,
): OAuthFlowCookieState {
  const flowRaw = getCookie(OAUTH_FLOW_COOKIE);
  const nextRaw = getCookie(OAUTH_NEXT_COOKIE);

  let next = resolveSafeAuthNextPath(null);
  if (nextRaw) {
    try {
      next = resolveSafeAuthNextPath(decodeURIComponent(nextRaw));
    } catch {
      next = resolveSafeAuthNextPath(nextRaw);
    }
  }

  return {
    flow: isOAuthFlow(flowRaw) ? flowRaw : null,
    next,
  };
}

export function clearOAuthFlowCookies(response: NextResponse): void {
  const options = {
    path: "/",
    maxAge: 0,
    sameSite: "lax" as const,
  };
  response.cookies.set(OAUTH_FLOW_COOKIE, "", options);
  response.cookies.set(OAUTH_NEXT_COOKIE, "", options);
}

export function redirectWithOAuthCookieClear(url: string): NextResponse {
  const response = NextResponse.redirect(url);
  clearOAuthFlowCookies(response);
  return response;
}
