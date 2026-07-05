export const GUEST_SUBMITTER_COOKIE = "forge_guest_submitter";

/** Abuse-prevention cookie lifetime — not an account identifier. */
export const GUEST_SUBMITTER_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;

export const GUEST_VOICE_ANSWER_MAX = 500;
export const GUEST_DETAILED_FIELD_MAX = 2000;

export const GUEST_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
export const GUEST_RATE_LIMIT_IP_PER_PROJECT = 30;
export const GUEST_RATE_LIMIT_SUBMITTER_VOICE_BURST = 10;
export const GUEST_RATE_LIMIT_SUBMITTER_BOOTSTRAP = 20;

/** Response kinds safe for public bucket aggregation (excludes short_text). */
export const PUBLIC_VOICE_BUCKET_KINDS = [
  "yes_no",
  "scale_3",
  "choice",
  "replay_intent",
] as const;
