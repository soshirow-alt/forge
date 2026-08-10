/**
 * Feedback reciprocity + announcement window contracts (no remote DB).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { notificationTargetHref } from "../lib/project-nurture-links";
import type { Notification } from "../lib/notifications";
import {
  buildTransactionalEmail,
  isTransactionalEmailTemplateKey,
} from "../lib/transactional-email";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const migration093 = read(
  "supabase/migrations/093_feedback_reciprocity_notifications.sql",
);
const migration094 = read(
  "supabase/migrations/094_platform_announcement_publish_window.sql",
);
assert.match(migration093, /feedback_reciprocity/);
assert.match(migration093, /consider_feedback_reciprocity/);
assert.match(migration093, /dismiss_stale_feedback_reciprocity/);
assert.match(migration093, /feedback-reciprocity:/);
assert.match(migration093, /enqueue_transactional_email/);
assert.match(migration093, /related_user_id/);
assert.doesNotMatch(migration093, /090_|091_|092_/);

assert.match(migration094, /starts_at/);
assert.match(migration094, /ends_at/);
assert.match(migration094, /get_public_platform_announcement_archive/);
assert.match(migration094, /cta_label/);

assert.equal(isTransactionalEmailTemplateKey("feedback_reciprocity"), true);
const mail = buildTransactionalEmail("feedback_reciprocity", {
  actor_user_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  actor_display_name: "Alice",
  receiving_project_title: "Bob Game",
});
assert.match(mail.subject, /フィードバックが届きました/);
assert.match(mail.text, /Alice/);
assert.match(mail.text, /Bob Game/);
assert.doesNotMatch(mail.text, /フィードバック本文全文/);
assert.match(mail.text, /creators\/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/);

const href = notificationTargetHref({
  id: "n1",
  type: "feedback_reciprocity",
  message: "x",
  date: new Date().toISOString(),
  projectId: "proj",
  projectTitle: "p",
  read: false,
  relatedUserId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
} as Notification);
assert.equal(href, "/creators/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

const route = read("app/api/feedback/reciprocity/route.ts");
assert.match(route, /consider_feedback_reciprocity/);
assert.match(route, /scheduleEmailOutboxKickBestEffort/);

const provider = read("components/games-provider.tsx");
assert.match(provider, /scheduleFeedbackReciprocity/);
assert.match(provider, /dismiss_stale_feedback_reciprocity/);

const profile = read("components/creator-profile-page.tsx");
assert.match(profile, /feedback-reciprocity:/);
assert.match(profile, /acknowledgeNotificationsByCoalesceKey/);
assert.match(profile, /canRenderRealProfile/);

const stagingAnnounce = read(
  "scripts/staging-only/ops-publish-release-announcement-2026-08.sql",
);
const prodAnnounce = read(
  "scripts/production-ops/ops-publish-release-announcement-2026-08.sql",
);
assert.match(stagingAnnounce, /forge-five-category-collab-2026-08/);
assert.match(prodAnnounce, /forge-five-category-collab-2026-08/);
assert.match(prodAnnounce, /do not apply from Cursor/i);

const terms = read("components/terms-of-service-document.tsx");
const privacy = read("components/privacy-policy-document.tsx");
assert.match(terms, /使用関係/);
assert.match(terms, /利用・コラボ相談/);
assert.match(terms, /著作権の譲渡/);
assert.match(privacy, /Resend/);
assert.match(privacy, /acknowledgement/);

console.log("PASS verify-feedback-reciprocity-contract");
