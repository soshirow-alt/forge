/**
 * Watch-update notification fanout contracts (no remote DB).
 * Covers confirmation recipient split, soft-fail, category copy, coalesce keys,
 * INSERT-not-upsert watch toggle, and per-recipient fanout inserts.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createVersionPublishedMessage,
  getNotificationTypeLabel,
  getNotificationActionHint,
  watchUpdateCoalesceKey,
  watchUpdatePrimaryCtaLabel,
} from "../lib/notifications";
import { selectWatchUpdateRecipientIds } from "../lib/watch-update-notify";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const provider = read("components/games-provider.tsx");
assert.match(provider, /selectWatchUpdateRecipientIds/);
assert.match(
  provider,
  /\[watch-notify\] confirmation fanout failed after successful publish\/devlog/,
);
assert.match(
  provider,
  /\[watch-notify\] watcher fanout failed after successful publish\/devlog/,
);
assert.doesNotMatch(
  provider,
  /if \(confirmationDraft\?\.notifyEnabled === false\) \{\s*return;/,
);
assert.match(provider, /watchUpdateCoalesceKey/);
assert.match(provider, /game\?\.category/);

const notifDb = read("lib/supabase/user-notifications-db.ts");
assert.match(notifDb, /insertWatchFanoutRows/);
assert.match(notifDb, /WatchFanoutResult/);
assert.match(notifDb, /deliveredUserIds/);
assert.match(notifDb, /failureCount/);
assert.match(notifDb, /coalesce_key: input\.coalesceKey/);
assert.match(notifDb, /isUniqueViolationError/);

assert.match(provider, /confirmationFanout\.deliveredUserIds/);
assert.match(provider, /confirmationFanout\.failureCount/);

const engagement = read("lib/supabase/user-engagement.ts");
assert.match(engagement, /from\("project_watches"\)\.insert/);
assert.doesNotMatch(
  engagement,
  /from\("project_watches"\)\.upsert/,
);
assert.match(engagement, /isUniqueViolationError/);

assert.deepEqual(
  selectWatchUpdateRecipientIds({
    watcherIds: ["w1", "w2", "actor", "w1"],
    actorUserId: "actor",
    confirmationRecipientIds: ["w2"],
  }),
  ["w1"],
);
assert.deepEqual(
  selectWatchUpdateRecipientIds({
    watcherIds: ["w1", "w2"],
    actorUserId: "actor",
    confirmationRecipientIds: [],
  }),
  ["w1", "w2"],
);
assert.deepEqual(
  selectWatchUpdateRecipientIds({
    watcherIds: ["actor"],
    actorUserId: "actor",
  }),
  [],
);

assert.equal(
  watchUpdateCoalesceKey({
    updateType: "version_published",
    projectId: "p1",
    updateEntityId: "d1",
  }),
  "watch-update:version_published:p1:d1",
);

assert.match(
  createVersionPublishedMessage("Song", "1.1", "audio"),
  /もう一度聴く/,
);
assert.doesNotMatch(
  createVersionPublishedMessage("Song", "1.1", "audio"),
  /プレイ/,
);
assert.match(
  createVersionPublishedMessage("Pack", "2.0", "asset"),
  /更新を見る/,
);
assert.match(
  createVersionPublishedMessage("Tool", "3.0", "dev-tool"),
  /最新版を確認/,
);
assert.match(
  createVersionPublishedMessage("Svc", "4.0", "service-app"),
  /利用/,
);
assert.match(
  createVersionPublishedMessage("Game", "5.0", "game"),
  /もう一度プレイ/,
);

assert.equal(watchUpdatePrimaryCtaLabel("audio"), "もう一度聴く");
assert.equal(watchUpdatePrimaryCtaLabel("asset"), "更新を見る");
assert.equal(watchUpdatePrimaryCtaLabel("game"), "もう一度プレイする");

assert.equal(getNotificationTypeLabel("version_published"), "新しいverが公開");
assert.equal(getNotificationActionHint("version_published"), "新verを確認する →");

const migration102 = read(
  "supabase/migrations/102_project_watches_authenticated_grants.sql",
);
assert.match(
  migration102,
  /GRANT SELECT, INSERT, DELETE ON TABLE public\.project_watches TO authenticated/,
);
assert.doesNotMatch(migration102, /GRANT[^\n]*UPDATE[^\n]*project_watches/);

const migration103 = read(
  "supabase/migrations/103_user_notifications_watch_update_coalesce_unique.sql",
);
assert.match(
  migration103,
  /user_notifications_watch_update_coalesce_uidx/,
);
assert.match(migration103, /watch-update:%/);
assert.match(migration103, /row_number\(\) OVER/);
assert.match(migration103, /DELETE FROM public\.user_notifications/);

const preflight = read(
  "scripts/production-rollout/2026-08/read-only-preflight-watch-update-coalesce.sql",
);
assert.match(preflight, /HAVING count\(\*\) > 1/);

const postapply = read(
  "scripts/production-rollout/2026-08/read-only-postapply-watch-update-102-103.sql",
);
assert.match(postapply, /user_notifications_watch_update_coalesce_uidx/);
assert.match(postapply, /indisunique/);
assert.match(postapply, /project_watches/);

const mypageCard = read("components/mypage-watch-card.tsx");
assert.match(mypageCard, /watchUpdatePrimaryCtaLabel/);
assert.doesNotMatch(mypageCard, /label: "もう一度プレイする"/);

console.log("verify-watch-update-notifications: PASS");
