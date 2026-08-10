import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const migration = read("supabase/migrations/089_notification_seen_ack.sql");
const db = read("lib/supabase/user-notifications-db.ts");
const provider = read("components/games-provider.tsx");
const page = read("components/notifications-v0-page.tsx");
assert.match(migration, /requires_acknowledgement AND acknowledged_at IS NULL/);
assert.match(migration, /NOT requires_acknowledgement AND seen_at IS NULL/);
assert.match(db, /requires_acknowledgement/);
assert.match(db, /acknowledge_notification/);
assert.match(db, /mark_notifications_seen/);
assert.match(db, /\.update\(\{ read_at: now, seen_at: now \}\)/);
assert.match(db, /\.or\("read_at\.is\.null,seen_at\.is\.null"\)/);
assert.match(provider, /notification\.requiresAcknowledgement/);
assert.match(page, /markNotificationsSeen/);
console.log("PASS verify-notification-seen-ack-contract");
