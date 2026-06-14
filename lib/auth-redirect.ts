const DEFAULT_WELCOME_PATH = "/auth/welcome";

export function getEmailConfirmRedirectUrl(): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");

  const next = encodeURIComponent(DEFAULT_WELCOME_PATH);
  return `${origin}/auth/callback?next=${next}`;
}

export function resolveSafeAuthNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return DEFAULT_WELCOME_PATH;
  }

  return next;
}
