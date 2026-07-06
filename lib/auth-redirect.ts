import { sanitizeLoginReturnUrl } from "@/lib/login-return-url";

const DEFAULT_WELCOME_PATH = "/auth/welcome";

/** Supabase Redirect URLs allowlist と一致必須（末尾スラッシュなし）。 */
export const FORGE_PREVIEW_OAUTH_ORIGIN =
  "https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app";

export const FORGE_PRODUCTION_OAUTH_ORIGIN =
  "https://forge-flame-gamma.vercel.app";

export type OAuthFlow = "x_login" | "x_link";

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, "");
}

function getAuthOrigin(): string {
  return typeof window !== "undefined"
    ? normalizeOrigin(window.location.origin)
    : normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
}

/** OAuth must start in the browser — always use the page origin, never NEXT_PUBLIC_SITE_URL. */
export function getClientAuthOrigin(): string {
  if (typeof window === "undefined") {
    throw new Error("OAuth redirect must be started from the browser.");
  }

  return normalizeOrigin(window.location.origin);
}

export function buildAuthWelcomePath(returnParam?: string | null): string {
  const safe = sanitizeLoginReturnUrl(returnParam);
  if (!safe) {
    return DEFAULT_WELCOME_PATH;
  }

  const params = new URLSearchParams({ return: safe });
  return `${DEFAULT_WELCOME_PATH}?${params.toString()}`;
}

export function getEmailConfirmRedirectUrl(returnParam?: string | null): string {
  const next = encodeURIComponent(buildAuthWelcomePath(returnParam));
  return `${getAuthOrigin()}/auth/callback?next=${next}`;
}

export function getPasswordResetRedirectUrl(): string {
  const next = encodeURIComponent("/auth/reset-password");
  return `${getAuthOrigin()}/auth/callback?next=${next}`;
}

export function getEmailChangeRedirectUrl(): string {
  const next = encodeURIComponent("/settings?email=confirmed");
  return `${getAuthOrigin()}/auth/callback?next=${next}`;
}

/** Supabase redirectTo — query なし（allowlist 完全一致）。flow/next は cookie で渡す。 */
export function getOAuthRedirectUrl(): string {
  return `${getClientAuthOrigin()}/auth/callback`;
}

export function buildOAuthCallbackRedirectUrl(origin: string): string {
  return `${normalizeOrigin(origin)}/auth/callback`;
}

export function resolveSafeAuthNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return DEFAULT_WELCOME_PATH;
  }

  return next;
}

export function resolveOAuthCallbackDestination(options: {
  flow: string | null;
  next: string;
}): string {
  if (options.flow === "x_link") {
    return "/settings?x=linked";
  }

  return options.next;
}

export function resolveOAuthCallbackErrorPath(flow: string | null): string {
  if (flow === "x_link") {
    return "/settings?x=error&reason=callback_failed";
  }

  return "/login?error=auth_callback";
}
