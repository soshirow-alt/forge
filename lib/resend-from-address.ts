/**
 * Resend From-address helpers.
 * Production must not ship with @resend.dev onboarding sender.
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
 * Production readiness / send-time guard.
 * Preview may use @resend.dev for smoke. Production must use a verified custom domain.
 * Throws only for the email send path — callers must not fail business mutations.
 */
export function assertTransactionalFromAllowed(input: {
  fromHeader: string;
  deploymentMode: "preview" | "local" | "production";
}): void {
  if (input.deploymentMode !== "production") return;
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
