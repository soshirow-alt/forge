/**
 * Deterministic notification email preference + CTA/footer/copy guards.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEFAULT_USER_SETTINGS,
  emailTemplateCategory,
  isTransactionalEmailPrefEnabled,
} from "../lib/user-settings-definitions";
import { buildTransactionalEmail } from "../lib/transactional-email";
import { notificationTargetHref } from "../lib/project-nurture-links";
import type { Notification } from "../lib/notifications";

assert.equal(emailTemplateCategory("collab_consultation_new"), "messages_collab");
assert.equal(emailTemplateCategory("usage_relation_request"), "usage_relation");
assert.equal(emailTemplateCategory("feedback_reciprocity"), "feedback_reciprocity");
assert.equal(emailTemplateCategory("unknown"), null);

// Missing prefs / defaults → ON
assert.equal(
  isTransactionalEmailPrefEnabled(undefined, "collab_consultation_new"),
  true,
);
assert.equal(
  isTransactionalEmailPrefEnabled(DEFAULT_USER_SETTINGS.notifyEmail, "collab_consultation_new"),
  true,
);

// Master OFF
assert.equal(
  isTransactionalEmailPrefEnabled(
    { ...DEFAULT_USER_SETTINGS.notifyEmail, master: false },
    "collab_consultation_new",
  ),
  false,
);

// Category OFF
assert.equal(
  isTransactionalEmailPrefEnabled(
    { ...DEFAULT_USER_SETTINGS.notifyEmail, messages_collab: false },
    "collab_consultation_new",
  ),
  false,
);
assert.equal(
  isTransactionalEmailPrefEnabled(
    { ...DEFAULT_USER_SETTINGS.notifyEmail, messages_collab: false },
    "usage_relation_request",
  ),
  true,
);

process.env.NEXT_PUBLIC_SITE_URL =
  "https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app";
const built = buildTransactionalEmail("collab_consultation_new", {
  consultation_id: "11111111-1111-1111-1111-111111111111",
});
assert.match(built.text, /settings#email-notifications/);
assert.match(built.html, /メール通知設定を変更/);
assert.match(built.text, /\/messages\//);
assert.doesNotMatch(built.text, /forge-games\.net\/messages/);
assert.doesNotMatch(built.text, /must-not-appear/);

const notif: Notification = {
  id: "n1",
  type: "consultation_new",
  message: "新しいメッセージが届きました",
  date: new Date().toISOString(),
  projectId: "",
  projectTitle: "",
  read: false,
  consultationId: "11111111-1111-1111-1111-111111111111",
};
assert.equal(
  notificationTargetHref(notif),
  "/messages/11111111-1111-1111-1111-111111111111",
);

const settingsForm = readFileSync(
  join(process.cwd(), "components/forge-settings-form.tsx"),
  "utf8",
);
assert.match(settingsForm, /id=\"email-notifications\"/);
assert.match(settingsForm, /メール通知/);
assert.match(settingsForm, /emailMasterItem/);
assert.match(settingsForm, /emailCategoryItems/);
assert.doesNotMatch(settingsForm, />Studio</);
assert.doesNotMatch(settingsForm, /フォロー中の開発者/);

const settingsDefs = readFileSync(
  join(process.cwd(), "lib/user-settings-definitions.ts"),
  "utf8",
);
assert.match(settingsDefs, /重要な通知をメールで受け取る/);
assert.match(settingsDefs, /メッセージ・コラボ/);
assert.match(settingsDefs, /messages_collab/);
assert.match(settingsDefs, /フォロー中のクリエイター/);

const migration031 = readFileSync(
  join(process.cwd(), "supabase/migrations/031_voice_notifications_always_on.sql"),
  "utf8",
);
assert.doesNotMatch(migration031, /notify_studio\s*->>\s*'voice'/);
assert.match(migration031, /always on/i);

const migration098 = readFileSync(
  join(process.cwd(), "supabase/migrations/098_remove_dead_notify_studio_voice.sql"),
  "utf8",
);
assert.match(migration098, /notify_studio = coalesce\(notify_studio/);
assert.match(migration098, /-\s*'voice'/);
assert.doesNotMatch(
  readFileSync(
    join(process.cwd(), "lib/user-settings-definitions.ts"),
    "utf8",
  ),
  /StudioNotificationPrefKey[\s\S]*voice/,
);

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/096_transactional_email_preferences.sql"),
  "utf8",
);
assert.match(migration, /notify_email/);
assert.match(migration, /suppressed/);
assert.match(migration, /evaluate_transactional_email_outbox_row/);
assert.match(migration, /transactional_email_pref_allows/);

const consultationsRedirect = readFileSync(
  join(process.cwd(), "app/(player)/consultations/[id]/page.tsx"),
  "utf8",
);
assert.match(consultationsRedirect, /\/messages\//);

console.log("verify-email-notification-prefs: PASS");
