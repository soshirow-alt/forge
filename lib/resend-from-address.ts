/**
 * Resend From-address helpers.
 * True Vercel Production must not ship with @resend.dev onboarding sender.
 * Preview may force FORGE_PRODUCTION_MODE for UI while still smoking with @resend.dev.
 */

const RESEND_DEV_HOST = /@resend\.dev\b/i;

export function extractEmailAddress(fromHeader: string): string | null {
  const trimmed = fromHeader.trim();
  if (!trimmed) return null;
  const angled = trimmed.match(/<([^>]+)>/);
  const candidate = (angled?.[1] || trimmed).trim().toLowerCase();
  if (!candidate.includes("@")) return null;
  return candidate;
}

export function isResendDevSender(fromHeader: string): boolean {
  const address = extractEmailAddress(fromHeader);
  if (!address) return RESEND_DEV_HOST.test(fromHeader);
  return RESEND_DEV_HOST.test(address);
}

/**
 * Hard-block @resend.dev only on Vercel Production runtime.
 * Preview / local remain allowed for smoke (even when UI production-mode override is on).
 * Throws only for the email send path — callers must not fail business mutations.
 */
export function assertTransactionalFromAllowed(input: {
  fromHeader: string;
  /**
   * Optional explicit signal. Prefer VERCEL_ENV=production over Forge UI mode overrides.
   */
  vercelEnv?: string | null;
}): void {
  const vercelEnv = (input.vercelEnv ?? process.env.VERCEL_ENV ?? "").trim();
  if (vercelEnv !== "production") return;

  if (isResendDevSender(input.fromHeader)) {
    throw new Error(
      "Production RESEND_FROM_EMAIL must not use @resend.dev — configure a verified custom-domain sender",
    );
  }
  const address = extractEmailAddress(input.fromHeader);
  if (!address) {
    throw new Error("Production RESEND_FROM_EMAIL is missing or malformed");
  }
}
