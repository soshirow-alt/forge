const DEFAULT_WELCOME_PATH = "/auth/welcome";

function getAuthOrigin(): string {
  return typeof window !== "undefined"
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
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

export function getOAuthRedirectUrl(nextPath?: string | null): string {
  const next = encodeURIComponent(resolveSafeAuthNextPath(nextPath ?? null));
  return `${getAuthOrigin()}/auth/callback?next=${next}`;
}

export function resolveSafeAuthNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return DEFAULT_WELCOME_PATH;
  }

  return next;
}
