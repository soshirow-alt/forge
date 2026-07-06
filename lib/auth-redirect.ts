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

export function getEmailConfirmRedirectUrl(): string {
  const next = encodeURIComponent(DEFAULT_WELCOME_PATH);
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

export function buildAuthCallbackUrl(options: {
  origin: string;
  nextPath?: string | null;
  flow?: OAuthFlow;
}): string {
  const params = new URLSearchParams();
  params.set("next", resolveSafeAuthNextPath(options.nextPath ?? null));
  if (options.flow) {
    params.set("flow", options.flow);
  }
  return `${normalizeOrigin(options.origin)}/auth/callback?${params.toString()}`;
}

export function getOAuthRedirectUrl(
  nextPath?: string | null,
  flow?: OAuthFlow,
): string {
  return buildAuthCallbackUrl({
    origin: getClientAuthOrigin(),
    nextPath,
    flow,
  });
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
