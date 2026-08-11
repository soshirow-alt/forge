/**
 * Resend From-address helpers.
 * True Vercel Production must not ship with @resend.dev onboarding sender.
 * Production readiness also requires the current verified sending domain
 * (default mail.forgeplace.app). Override via FORGE_PRODUCTION_SENDING_DOMAIN
 * if the mailbox domain changes later — do not invent mailboxes in callers.
 */

const RESEND_DEV_HOST = /@resend\.dev\b/i;

export const DEFAULT_PRODUCTION_SENDING_DOMAIN = "mail.forgeplace.app";

export function getExpectedProductionSendingDomain(): string {
  const override = process.env.FORGE_PRODUCTION_SENDING_DOMAIN?.trim().toLowerCase();
  return override || DEFAULT_PRODUCTION_SENDING_DOMAIN;
}

export function extractEmailAddress(fromHeader: string): string | null {
  const trimmed = fromHeader.trim();
  if (!trimmed) return null;
  const angled = trimmed.match(/<([^>]+)>/);
  const candidate = (angled?.[1] || trimmed).trim().toLowerCase();
  if (!candidate.includes("@")) return null;
  return candidate;
}

export function extractEmailDomain(fromHeader: string): string | null {
  const address = extractEmailAddress(fromHeader);
  if (!address) return null;
  const at = address.lastIndexOf("@");
  if (at < 0) return null;
  const domain = address.slice(at + 1).trim().toLowerCase();
  return domain || null;
}

export function isResendDevSender(fromHeader: string): boolean {
  const address = extractEmailAddress(fromHeader);
  if (!address) return RESEND_DEV_HOST.test(fromHeader);
  return RESEND_DEV_HOST.test(address);
}

export function isExpectedProductionSendingDomain(fromHeader: string): boolean {
  const domain = extractEmailDomain(fromHeader);
  return domain === getExpectedProductionSendingDomain();
}

/**
 * Hard-block @resend.dev only on Vercel Production runtime.
 * Also require the expected verified sending domain (mail.forgeplace.app
 * unless FORGE_PRODUCTION_SENDING_DOMAIN is set).
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
  const domain = extractEmailDomain(input.fromHeader);
  const expected = getExpectedProductionSendingDomain();
  if (domain !== expected) {
    throw new Error(
      `Production RESEND_FROM_EMAIL must use @${expected}`,
    );
  }
}
