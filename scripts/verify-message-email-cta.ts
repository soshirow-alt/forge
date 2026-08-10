/**
 * Message email CTA deep-link + stale-thread fallback guards.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildTransactionalEmail } from "../lib/transactional-email";

process.env.NEXT_PUBLIC_SITE_URL =
  "https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app";
process.env.VERCEL_ENV = "preview";

const consultationId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const built = buildTransactionalEmail("collab_consultation_new", {
  consultation_id: consultationId,
});
assert.match(
  built.text,
  new RegExp(`/messages/${consultationId}`),
);
assert.doesNotMatch(built.text, /\/consultations\//);
assert.match(built.html, /Forgeで確認する/);

const thread = readFileSync(
  join(process.cwd(), "components/consultation-thread.tsx"),
  "utf8",
);
assert.match(thread, /response\.status === 404/);
assert.match(thread, /notice=unavailable/);
assert.match(thread, /router\.replace/);

const inbox = readFileSync(
  join(process.cwd(), "components/messages-inbox-page.tsx"),
  "utf8",
);
assert.match(inbox, /このメッセージは現在表示できません/);
assert.match(inbox, /notice === \"unavailable\"/);

const realEmail = readFileSync(
  join(process.cwd(), "scripts/staging-only/verify-preview-real-email.ts"),
  "utf8",
);
assert.match(realEmail, /cta_target_alive/);
assert.doesNotMatch(
  realEmail,
  /from\(\"collab_consultations\"\)\.delete\(\)/,
);
assert.match(realEmail, /ensureOperationMessengerFixture/);

console.log("verify-message-email-cta: PASS");
