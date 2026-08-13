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
assert.match(migration093, /actor_has_public_project/);
assert.match(migration093, /developer_profiles/);
assert.match(migration093, /users_are_blocking/);
assert.match(migration093, /v_owner = p_actor_id/);
assert.match(migration093, /visibility = 'public'/);
assert.match(migration093, /project_feedback_reciprocity_notify/);
assert.match(migration093, /project_voice_responses_reciprocity_notify/);
assert.match(migration093, /dismiss_stale_feedback_reciprocity/);
assert.match(migration093, /feedback-reciprocity:/);
assert.match(migration093, /enqueue_transactional_email/);
assert.match(migration093, /user_notifications_reciprocity_open_uidx/);
assert.doesNotMatch(migration093, /GRANT EXECUTE ON FUNCTION public\.consider_feedback_reciprocity\(uuid, uuid\)\s+TO authenticated/);

const migration095 = read(
  "supabase/migrations/095_feedback_reciprocity_project_id_text_cast.sql",
);
assert.match(migration095, /consider_feedback_reciprocity/);
assert.match(migration095, /trg_consider_feedback_reciprocity_from_feedback/);
assert.match(migration095, /trg_consider_feedback_reciprocity_from_voice/);
assert.match(migration095, /v_project_id/);

const voiceNotif = read("supabase/migrations/009_voice_received_notifications.sql");
assert.match(voiceNotif, /voice_received/);
assert.match(voiceNotif, /project_voice_responses/);

const reciprocityDoc = read("docs/feedback-reciprocity-current.md");
assert.match(reciprocityDoc, /developer_profiles/);
assert.match(reciprocityDoc, /detailed-only/);
assert.match(reciprocityDoc, /voice_received/);
assert.match(reciprocityDoc, /強制交換ではない/);
assert.match(reciprocityDoc, /creator profile/);

assert.match(migration094, /starts_at/);
assert.match(migration094, /ends_at/);
assert.match(migration094, /get_public_platform_announcement_archive/);
assert.match(migration094, /cta_label/);
assert.match(
  migration094,
  /get_public_platform_announcement_archive[\s\S]*starts_at[\s\S]*<= now\(\)/,
);

assert.equal(isTransactionalEmailTemplateKey("feedback_reciprocity"), true);
const mail = buildTransactionalEmail("feedback_reciprocity", {
  actor_user_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  actor_display_name: "Alice",
  receiving_project_title: "Bob Game",
});
assert.match(mail.subject, /フィードバックが届きました/);
assert.match(mail.text, /Alice/);
assert.match(mail.text, /Bob Game/);
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
assert.match(route, /scheduleEmailOutboxKickBestEffort/);
assert.doesNotMatch(route, /consider_feedback_reciprocity/);
assert.match(route, /INSERT triggers/);

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
