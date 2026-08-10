import { timingSafeEqual } from "node:crypto";

function timingSafeMatches(expected: string, supplied: string): boolean {
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function isEmailOutboxRequestAuthorized(
  request: Request,
  secrets: {
    emailOutboxSecret?: string;
    cronSecret?: string;
  } = {
    emailOutboxSecret: process.env.EMAIL_OUTBOX_SECRET,
    cronSecret: process.env.CRON_SECRET,
  },
): boolean {
  const supplied =
    request.headers.get("x-email-outbox-secret")?.trim() ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!supplied) return false;

  const candidates = [
    secrets.emailOutboxSecret?.trim(),
    secrets.cronSecret?.trim(),
  ].filter((secret): secret is string => Boolean(secret));
  if (candidates.length === 0) return false;

  // Evaluate every configured candidate so either independently configured
  // operational secret remains valid when both are present.
  return candidates.map((secret) => timingSafeMatches(secret, supplied)).some(Boolean);
}
