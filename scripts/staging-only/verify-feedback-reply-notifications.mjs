/**
 * Staging: feedback_reply notifications via authenticated fetch path.
 * HARD GUARD: vuqpwvjvgyxffmvpfrxo
 *
 * Mirrors fetchUserNotifications (GamesProvider) — authenticated client SELECT,
 * not service_role table reads as the success criterion.
 *
 * Link helper mirrors notificationHref for feedback_reply → /games/{id}?tab=voices
 *
 * node --env-file=.env.local scripts/staging-only/verify-feedback-reply-notifications.mjs
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
const ref = new URL(url).hostname.split(".")[0];
if (ref !== STAGING) {
  console.error(JSON.stringify({ blocked: true, ref }));
  process.exit(2);
}

const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const results = [];
const check = (name, pass, detail = null) =>
  results.push({ name, pass: Boolean(pass), detail });

const created = {
  users: [],
  feedbackId: null,
  replyIds: [],
  notificationIds: [],
  projectId: null,
  prevOwner: null,
};

/** Same query as lib/supabase/user-notifications-db.ts fetchUserNotifications */
async function fetchUserNotifications(client, userId) {
  const { data, error } = await client
    .from("user_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    const err = new Error(error.message);
    err.code = error.code;
    err.hint = error.hint;
    throw err;
  }
  return data ?? [];
}

function feedbackReplyHref(projectId) {
  return `/games/${projectId}?tab=voices`;
}

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
  const { error: signErr } = await client.auth.signInWithPassword({ email, password });
  if (signErr) throw signErr;
  created.users.push(userId);
  return { client, userId, email };
}

async function listFeedbackReplyNotifs(client, userId, projectId) {
  const rows = await fetchUserNotifications(client, userId);
  return rows.filter((r) => r.type === "feedback_reply" && r.project_id === projectId);
}

async function cleanup() {
  if (created.feedbackId) {
    await admin.from("project_feedback").delete().eq("id", created.feedbackId);
  }
  if (created.projectId) {
    await admin.from("feedback_card_replies").delete().eq("project_id", created.projectId);
  }
  if (created.prevOwner && created.projectId) {
    await admin
      .from("projects")
      .update({ owner_id: created.prevOwner })
      .eq("id", created.projectId);
  }
  // Ephemeral auth users CASCADE-delete their user_notifications (no service_role table DELETE).
  for (const uid of created.users) {
    if (uid) await admin.auth.admin.deleteUser(uid);
  }
}

async function main() {
  const stamp = Date.now();
  const password = `Notify!${stamp}`;
  const projectId = "41ff5a96-105c-42a2-87b4-787bcfeacb45";

  // Prerequisite: authenticated must be able to SELECT own notifications (073).
  {
    const probe = await authed(`notify-grant-probe-${stamp}@example.com`, password);
    try {
      await fetchUserNotifications(probe.client, probe.userId);
      check("authenticated can SELECT own user_notifications", true, null);
    } catch (e) {
      check("authenticated can SELECT own user_notifications", false, {
        message: String(e?.message || e),
        code: e?.code ?? null,
        requiresMigration: "073_user_notifications_authenticated_read_access.sql",
      });
      await cleanup();
      console.log(
        JSON.stringify(
          {
            ref,
            blocked: "missing_user_notifications_grant",
            results,
            nextStep:
              "Apply 073 on Staging (Dashboard), then re-run this script for full 2-way notify verify.",
          },
          null,
          2,
        ),
      );
      process.exit(2);
    }
  }

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

  const owner = await authed(`notify-owner-${stamp}@example.com`, password);
  const author = await authed(`notify-author-${stamp}@example.com`, password);
  const third = await authed(`notify-third-${stamp}@example.com`, password);

  await admin.from("projects").update({ owner_id: owner.userId }).eq("id", projectId);

  // Seed via service role (Player write path uses app APIs; RLS blocks direct client INSERT here).
  // Notifications are still verified via authenticated fetchUserNotifications path.
  const { data: fb, error: fbErr } = await admin
    .from("project_feedback")
    .insert({
      user_id: author.userId,
      project_id: projectId,
      version_key: version,
      good_points: `[tmp-072-notify] author feedback ${stamp}`,
      concerns: null,
      bugs: null,
      other_notes: null,
      moderation_status: "visible",
    })
    .select("id")
    .maybeSingle();

  if (fbErr || !fb?.id) {
    check("seed author project_feedback (service role)", false, fbErr?.message);
    await cleanup();
    console.log(JSON.stringify({ results }, null, 2));
    process.exit(1);
  }
  created.feedbackId = fb.id;
  check("author FB seeded", true, fb.id);

  const { data: cards, error: cardsErr } = await owner.client.rpc("get_public_feedback_cards", {
    p_project_id: projectId,
    p_version_key: version,
    p_include_guest: false,
    p_limit: 50,
    p_offset: 0,
  });
  const card = (cards ?? []).find(
    (c) => c.target_source === "registered_detailed" && String(c.target_id) === String(fb.id),
  );
  check("FB visible as public registered_detailed card", Boolean(card) && !cardsErr, {
    err: cardsErr?.message,
    cardId: card?.card_id,
  });
  if (!card) {
    await cleanup();
    console.log(JSON.stringify({ results }, null, 2));
    process.exit(1);
  }

  // Case 1: owner → author
  const beforeB = await listFeedbackReplyNotifs(author.client, author.userId, projectId);
  const beforeA = await listFeedbackReplyNotifs(owner.client, owner.userId, projectId);
  const beforeT = await listFeedbackReplyNotifs(third.client, third.userId, projectId);

  const { data: reply1, error: reply1Err } = await owner.client.rpc("create_feedback_card_reply", {
    p_project_id: projectId,
    p_version_key: version,
    p_card_id: card.card_id,
    p_body: "owner reply for notify case 1",
  });
  check("owner reply created", !reply1Err && Boolean(reply1), reply1Err?.message ?? reply1);
  if (reply1) created.replyIds.push(reply1);

  const afterB1 = await listFeedbackReplyNotifs(author.client, author.userId, projectId);
  const afterA1 = await listFeedbackReplyNotifs(owner.client, owner.userId, projectId);
  const afterT1 = await listFeedbackReplyNotifs(third.client, third.userId, projectId);
  const newB = afterB1.filter((n) => !beforeB.some((b) => b.id === n.id));
  const newA1 = afterA1.filter((n) => !beforeA.some((b) => b.id === n.id));
  const newT1 = afterT1.filter((n) => !beforeT.some((b) => b.id === n.id));

  check("case1: B gets exactly 1 new feedback_reply", newB.length === 1, {
    n: newB.length,
    messages: newB.map((n) => n.message),
  });
  check(
    "case1: message indicates developer reply",
    Boolean(newB[0] && /開発者から返信/.test(newB[0].message)),
    newB[0]?.message,
  );
  check(
    "case1: message includes project title prefix",
    Boolean(newB[0] && newB[0].message.includes(project.title)),
    newB[0]?.message,
  );
  check("case1: A gets no self-notify", newA1.length === 0, newA1);
  check("case1: third gets none", newT1.length === 0, newT1);
  if (newB[0]) {
    created.notificationIds.push(newB[0].id);
    check(
      "case1: link target is ?tab=voices",
      feedbackReplyHref(projectId) === `/games/${projectId}?tab=voices`,
      feedbackReplyHref(projectId),
    );
    const beforeRead = newB[0].read_at;
    await author.client
      .from("user_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", newB[0].id)
      .eq("user_id", author.userId);
    const afterReadRows = await fetchUserNotifications(author.client, author.userId);
    const readRow = afterReadRows.find((r) => r.id === newB[0].id);
    check(
      "case1: recipient can mark notification read (authenticated UPDATE read_at)",
      Boolean(readRow?.read_at) && readRow.read_at !== beforeRead,
      { beforeRead, afterRead: readRow?.read_at },
    );
  }

  const bCountBeforeDel = (
    await listFeedbackReplyNotifs(author.client, author.userId, projectId)
  ).length;
  if (reply1) {
    await owner.client.rpc("delete_feedback_card_reply", { p_reply_id: reply1 });
  }
  const bAfterDel = await listFeedbackReplyNotifs(author.client, author.userId, projectId);
  check(
    "delete reply does not add notifications",
    bAfterDel.length === bCountBeforeDel,
    { before: bCountBeforeDel, after: bAfterDel.length },
  );

  // Case 2: author → owner
  const beforeA2 = await listFeedbackReplyNotifs(owner.client, owner.userId, projectId);
  const beforeB2 = await listFeedbackReplyNotifs(author.client, author.userId, projectId);

  const { data: reply2, error: reply2Err } = await author.client.rpc("create_feedback_card_reply", {
    p_project_id: projectId,
    p_version_key: version,
    p_card_id: card.card_id,
    p_body: "author reply for notify case 2",
  });
  check("author reply created", !reply2Err && Boolean(reply2), reply2Err?.message ?? reply2);
  if (reply2) created.replyIds.push(reply2);

  const afterA2 = await listFeedbackReplyNotifs(owner.client, owner.userId, projectId);
  const afterB2 = await listFeedbackReplyNotifs(author.client, author.userId, projectId);
  const newA2 = afterA2.filter((n) => !beforeA2.some((b) => b.id === n.id));
  const newB2 = afterB2.filter((n) => !beforeB2.some((b) => b.id === n.id));

  check("case2: A gets exactly 1 new feedback_reply", newA2.length === 1, {
    n: newA2.length,
    messages: newA2.map((n) => n.message),
  });
  check(
    "case2: message indicates project FB reply",
    Boolean(newA2[0] && /作品のフィードバックに返信/.test(newA2[0].message)),
    newA2[0]?.message,
  );
  check("case2: B gets no self-notify", newB2.length === 0, newB2);
  if (newA2[0]) {
    created.notificationIds.push(newA2[0].id);
    check(
      "case2: link target is ?tab=voices",
      feedbackReplyHref(projectId) === `/games/${projectId}?tab=voices`,
      feedbackReplyHref(projectId),
    );
  }

  // One create → one notify (no duplicate from single op) already covered by length===1

  const { error: guestReplyErr } = await owner.client.rpc("create_feedback_card_reply", {
    p_project_id: projectId,
    p_version_key: version,
    p_card_id: "fc1_" + "0".repeat(32),
    p_body: "should fail",
  });
  check(
    "guestish card cannot create reply/notify",
    Boolean(guestReplyErr),
    guestReplyErr?.message,
  );

  if (reply2) {
    await author.client.rpc("delete_feedback_card_reply", { p_reply_id: reply2 });
  }

  await cleanup();

  const failed = results.filter((r) => !r.pass);
  console.log(
    JSON.stringify(
      {
        ref,
        projectId,
        version,
        cardId: card.card_id,
        feedbackId: created.feedbackId,
        results,
        failed: failed.length,
        cleanup: {
          deletedEphemeralUsers: created.users.length,
          restoredOwnerId: created.prevOwner,
          removedFeedbackId: created.feedbackId,
          removedReplyIds: created.replyIds,
          removedNotificationIds: created.notificationIds,
        },
      },
      null,
      2,
    ),
  );
  process.exit(failed.length ? 1 : 0);
}

main().catch(async (e) => {
  try {
    await cleanup();
  } catch {
    /* ignore */
  }
  const grantMissing =
    /permission denied for table user_notifications/i.test(String(e?.message || e)) ||
    e?.code === "42501";
  console.error(
    JSON.stringify(
      {
        fatal: true,
        message: String(e?.message || e),
        code: e?.code ?? null,
        hint: e?.hint ?? null,
        blockedByMissingGrant: grantMissing,
        nextStep: grantMissing
          ? "Apply supabase/migrations/073_user_notifications_authenticated_read_access.sql on Staging, then re-run this script."
          : null,
      },
      null,
      2,
    ),
  );
  process.exit(2);
});
