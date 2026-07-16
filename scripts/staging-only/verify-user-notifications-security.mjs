/**
 * Staging: user_notifications tamper-prevention + authenticated read/mark-read path.
 * HARD GUARD: vuqpwvjvgyxffmvpfrxo — ephemeral notification via service_role INSERT for probes only.
 *
 * Success criteria mirror Player path (fetchUserNotifications / markUserNotificationAsRead)
 * plus direct REST tamper attempts.
 *
 * node --env-file=.env.local scripts/staging-only/verify-user-notifications-security.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

const STAGING = "vuqpwvjvgyxffmvpfrxo";

function loadEnv() {
  const env = { ...process.env };
  for (const p of [".env.local", ".env"]) {
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i <= 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
        v = v.slice(1, -1);
      if (!env[k]) env[k] = v;
    }
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const ref = new URL(url).hostname.split(".")[0];
if (ref !== STAGING) {
  console.error(JSON.stringify({ blocked: true, ref }));
  process.exit(2);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anon = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const results = [];
const check = (name, pass, detail = null) =>
  results.push({ name, pass: Boolean(pass), detail });

async function authed(email, password) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error && !/already/i.test(error.message)) throw error;
  let userId = data?.user?.id;
  if (!userId) {
    const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    userId = listed?.users?.find((u) => u.email === email)?.id;
  }
  await client.auth.signInWithPassword({ email, password });
  return { client, userId };
}

/** lib/supabase/user-notifications-db.ts */
async function fetchUserNotifications(client, userId) {
  const { data, error } = await client
    .from("user_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** lib/supabase/user-notifications-db.ts */
async function markUserNotificationAsRead(client, userId, notificationId) {
  const { error } = await client
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId);
  if (error) throw error;
}

async function main() {
  const stamp = Date.now();
  const password = `Sec!${stamp}`;
  const created = { users: [], notifId: null, projectId: null, feedbackId: null, prevOwner: null };

  const owner = await authed(`notif-sec-owner-${stamp}@example.com`, password);
  const author = await authed(`notif-sec-author-${stamp}@example.com`, password);
  const other = await authed(`notif-sec-other-${stamp}@example.com`, password);
  created.users.push(owner.userId, author.userId, other.userId);

  const projectId = "41ff5a96-105c-42a2-87b4-787bcfeacb45";
  const { data: project, error: pErr } = await admin
    .from("projects")
    .select("id, owner_id, title, visibility, playable_version")
    .eq("id", projectId)
    .maybeSingle();
  if (pErr || !project || project.visibility !== "public") {
    throw new Error(`project missing: ${pErr?.message}`);
  }
  created.projectId = projectId;
  created.prevOwner = project.owner_id;
  const version = String(project.playable_version || "0.1");

  await admin.from("projects").update({ owner_id: owner.userId }).eq("id", projectId);

  const { data: fb, error: fbErr } = await admin
    .from("project_feedback")
    .insert({
      user_id: author.userId,
      project_id: projectId,
      version_key: version,
      good_points: `[sec-probe-${stamp}] feedback`,
      concerns: null,
      bugs: null,
      other_notes: null,
      moderation_status: "visible",
    })
    .select("id")
    .maybeSingle();
  if (fbErr || !fb?.id) {
    check("prerequisite: seed project_feedback", false, fbErr?.message);
    console.log(JSON.stringify({ ref, blocked: "seed_failed", results }, null, 2));
    process.exit(2);
  }
  created.feedbackId = fb.id;

  const { data: cards } = await owner.client.rpc("get_public_feedback_cards", {
    p_project_id: projectId,
    p_version_key: version,
    p_include_guest: false,
    p_limit: 50,
    p_offset: 0,
  });
  const card = (cards ?? []).find(
    (c) => c.target_source === "registered_detailed" && String(c.target_id) === String(fb.id),
  );
  if (!card) {
    check("prerequisite: public card for seeded feedback", false, null);
    console.log(JSON.stringify({ ref, blocked: "card_missing", results }, null, 2));
    process.exit(2);
  }

  const beforeAuthor = await fetchUserNotifications(author.client, author.userId).catch(() => []);
  const { error: replyErr } = await owner.client.rpc("create_feedback_card_reply", {
    p_project_id: projectId,
    p_version_key: version,
    p_card_id: card.card_id,
    p_body: "security probe reply",
  });
  check("prerequisite: create_feedback_card_reply seeds notification", !replyErr, replyErr?.message);

  const afterAuthor = await fetchUserNotifications(author.client, author.userId).catch(() => []);
  const seeded = afterAuthor.find((n) => !beforeAuthor.some((b) => b.id === n.id));
  if (!seeded?.id) {
    check("prerequisite: author received feedback_reply notification", false, {
      requiresMigration: "073_user_notifications_authenticated_read_access.sql",
    });
    console.log(JSON.stringify({ ref, blocked: "notification_missing", results }, null, 2));
    process.exit(2);
  }
  created.notifId = seeded.id;
  const seedMessage = seeded.message;

  // --- anon ---
  const anonSel = await anon.from("user_notifications").select("id").limit(1);
  check("anon SELECT denied", Boolean(anonSel.error), anonSel.error?.message);

  const anonUpd = await anon
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", seeded.id);
  check("anon UPDATE denied", Boolean(anonUpd.error), anonUpd.error?.message);

  // --- authenticated SELECT (app path) ---
  let ownerRows = [];
  try {
    ownerRows = await fetchUserNotifications(author.client, author.userId);
    check("author fetchUserNotifications succeeds", true, { count: ownerRows.length });
  } catch (e) {
    check("author fetchUserNotifications succeeds", false, {
      message: String(e?.message || e),
      requiresMigration: "073_user_notifications_authenticated_read_access.sql",
    });
  }

  const own = ownerRows.find((r) => r.id === seeded.id);
  check("author sees own seeded notification", Boolean(own), own?.id);

  const otherRows = await fetchUserNotifications(other.client, other.userId).catch((e) => {
    return { __error: e };
  });
  if (otherRows?.__error) {
    check("other user inbox fetch", false, otherRows.__error.message);
  } else {
    check(
      "other cannot see author notification in own inbox",
      !otherRows.some((r) => r.id === seeded.id),
      { otherCount: otherRows.length },
    );
  }

  const crossRead = await other.client
    .from("user_notifications")
    .select("id")
    .eq("id", seeded.id)
    .maybeSingle();
  check(
    "other direct SELECT by id returns empty/denied",
    Boolean(crossRead.error) || !crossRead.data,
    crossRead.error?.message ?? crossRead.data,
  );

  // --- mark read (app path) — recipient is author ---
  try {
    await markUserNotificationAsRead(author.client, author.userId, seeded.id);
    const afterReadRows = await fetchUserNotifications(author.client, author.userId);
    const readRow = afterReadRows.find((r) => r.id === seeded.id);
    check("author markUserNotificationAsRead sets read_at", Boolean(readRow?.read_at), readRow);
  } catch (e) {
    check("author markUserNotificationAsRead sets read_at", false, String(e?.message || e));
  }

  const otherMark = await other.client
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", seeded.id)
    .eq("user_id", author.userId);
  check(
    "other cannot mark author notification read",
    Boolean(otherMark.error) || otherMark.count === 0,
    otherMark.error?.message ?? { count: otherMark.count },
  );

  // --- tamper columns (recipient session) ---
  const tamperMessage = await author.client
    .from("user_notifications")
    .update({ message: "[tampered]" })
    .eq("id", seeded.id);
  check("owner cannot UPDATE message", Boolean(tamperMessage.error), tamperMessage.error?.message);

  const tamperType = await author.client
    .from("user_notifications")
    .update({ type: "devlog" })
    .eq("id", seeded.id);
  check("author cannot UPDATE type", Boolean(tamperType.error), tamperType.error?.message);

  const tamperProject = await author.client
    .from("user_notifications")
    .update({ project_id: "00000000-0000-0000-0000-000000000099" })
    .eq("id", seeded.id);
  check("author cannot UPDATE project_id", Boolean(tamperProject.error), tamperProject.error?.message);

  const tamperUser = await author.client
    .from("user_notifications")
    .update({ user_id: other.userId })
    .eq("id", seeded.id);
  check("author cannot UPDATE user_id", Boolean(tamperUser.error), tamperUser.error?.message);

  const insertFake = await author.client.from("user_notifications").insert({
    user_id: other.userId,
    type: "feedback_reply",
    project_id: created.projectId,
    message: "fake",
  });
  check(
    "non-owner cannot INSERT notification for other user",
    Boolean(insertFake.error),
    insertFake.error?.message,
  );

  check(
    "INSERT policy note: owner broadcast INSERT is allowed when 073 RLS passes (see verify-user-notifications-insert-attacks.mjs)",
    true,
    "not tested in this script",
  );

  const deleteOwn = await author.client.from("user_notifications").delete().eq("id", seeded.id);
  check("author cannot DELETE own notification", Boolean(deleteOwn.error), deleteOwn.error?.message);

  const { data: finalRow } = await author.client
    .from("user_notifications")
    .select("message, type, user_id, project_id")
    .eq("id", seeded.id)
    .maybeSingle();
  check("seeded content unchanged after tamper attempts", finalRow?.message === seedMessage, finalRow);

  if (created.feedbackId) {
    await admin.from("project_feedback").delete().eq("id", created.feedbackId);
  }
  if (created.prevOwner && created.projectId) {
    await admin
      .from("projects")
      .update({ owner_id: created.prevOwner })
      .eq("id", created.projectId);
  }

  // Cleanup: delete ephemeral user cascades notification
  for (const uid of created.users) {
    await admin.auth.admin.deleteUser(uid);
  }

  const failed = results.filter((r) => !r.pass);
  console.log(
    JSON.stringify(
      {
        ref,
        migration: "073_user_notifications_authenticated_read_access.sql",
        results,
        failed: failed.length,
      },
      null,
      2,
    ),
  );
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(JSON.stringify({ fatal: true, message: String(e?.message || e) }, null, 2));
  process.exit(2);
});
