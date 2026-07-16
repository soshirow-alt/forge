/**
 * Read-only audit: user_notifications schema / GRANT probes / RLS behavior (Staging).
 * HARD GUARD: vuqpwvjvgyxffmvpfrxo — ephemeral users only; does not modify existing notifications.
 *
 * node --env-file=.env.local scripts/staging-only/audit-user-notifications-staging.mjs
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

async function probeTableOp(client, op, payload = null) {
  try {
    if (op === "select") {
      const { error } = await client.from("user_notifications").select("id").limit(1);
      return { ok: !error, code: error?.code ?? null, message: error?.message ?? null, hint: error?.hint ?? null };
    }
    if (op === "insert") {
      const { error } = await client.from("user_notifications").insert({
        user_id: payload.userId,
        type: "devlog",
        project_id: payload.projectId,
        message: "[audit-probe] should not persist",
      });
      return { ok: !error, code: error?.code ?? null, message: error?.message ?? null, hint: error?.hint ?? null };
    }
    if (op === "update_read_at") {
      const { error } = await client
        .from("user_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", payload.id);
      return { ok: !error, code: error?.code ?? null, message: error?.message ?? null, hint: error?.hint ?? null };
    }
    if (op === "update_message") {
      const { error } = await client
        .from("user_notifications")
        .update({ message: "[audit-tamper]" })
        .eq("id", payload.id);
      return { ok: !error, code: error?.code ?? null, message: error?.message ?? null, hint: error?.hint ?? null };
    }
    if (op === "delete") {
      const { error } = await client.from("user_notifications").delete().eq("id", payload.id);
      return { ok: !error, code: error?.code ?? null, message: error?.message ?? null, hint: error?.hint ?? null };
    }
  } catch (e) {
    return { ok: false, code: null, message: String(e?.message || e), hint: null };
  }
  return { ok: false, code: null, message: "unknown op", hint: null };
}

async function main() {
  const stamp = Date.now();
  const password = `Audit!${stamp}`;
  const userA = await authed(`notif-audit-a-${stamp}@example.com`, password);
  const userB = await authed(`notif-audit-b-${stamp}@example.com`, password);

  const { data: sampleRow, error: sampleErr } = await admin
    .from("user_notifications")
    .select("*")
    .limit(1)
    .maybeSingle();

  const columnsFromSample = sampleRow ? Object.keys(sampleRow).sort() : null;

  const grantProbes = {
    anon: {
      select: await probeTableOp(anon, "select"),
    },
    authenticated: {
      select: await probeTableOp(userA.client, "select"),
      insert_non_owner: await probeTableOp(userA.client, "insert", {
        userId: userB.userId,
        projectId: "00000000-0000-0000-0000-000000000099",
      }),
      update_read_at_other: null,
      update_message_own: null,
      delete_own: null,
    },
    service_role: {
      select: await probeTableOp(admin, "select"),
      insert: await probeTableOp(admin, "insert", {
        userId: userA.userId,
        projectId: "00000000-0000-0000-0000-000000000099",
      }),
      delete: null,
    },
  };

  let ephemeralNotifId = null;
  if (grantProbes.service_role.insert.ok) {
    const { data: rows } = await admin
      .from("user_notifications")
      .select("id")
      .eq("user_id", userA.userId)
      .eq("message", "[audit-probe] should not persist")
      .limit(1);
    ephemeralNotifId = rows?.[0]?.id ?? null;
  }

  if (ephemeralNotifId) {
    grantProbes.authenticated.update_read_at_other = await probeTableOp(userB.client, "update_read_at", {
      id: ephemeralNotifId,
    });
    grantProbes.authenticated.update_message_own = await probeTableOp(userA.client, "update_message", {
      id: ephemeralNotifId,
    });
    grantProbes.authenticated.delete_own = await probeTableOp(userA.client, "delete", {
      id: ephemeralNotifId,
    });
    grantProbes.service_role.delete = await probeTableOp(admin, "delete", { id: ephemeralNotifId });
  }

  const { count: totalCount } = await admin
    .from("user_notifications")
    .select("id", { count: "exact", head: true });

  await admin.auth.admin.deleteUser(userA.userId);
  await admin.auth.admin.deleteUser(userB.userId);

  const report = {
    ref,
    auditedAt: new Date().toISOString(),
    table: "public.user_notifications",
    columnsFromLiveSample: columnsFromSample,
    sampleReadError: sampleErr?.message ?? null,
    totalRowCount: totalCount ?? null,
    codeReferences: {
      fetch: "lib/supabase/user-notifications-db.ts → fetchUserNotifications",
      markOneRead: "lib/supabase/user-notifications-db.ts → markUserNotificationAsRead",
      markAllRead: "lib/supabase/user-notifications-db.ts → markAllUserNotificationsAsRead",
      markVoiceRead: "lib/supabase/user-notifications-db.ts → markVoiceReceivedNotificationsReadForVersion",
      ownerInserts:
        "lib/supabase/user-notifications-db.ts → insertDevlogNotifications / insertVersionPublishedNotifications / insertConfirmationRequestNotifications / insertFollowedDeveloper*",
      feedbackReplyCreate: "RPC create_feedback_card_reply (070/071 SECURITY DEFINER)",
      voiceReceived: "trigger notify_owner_on_voice_response (009 SECURITY DEFINER)",
      projectWatched: "trigger notify_owner_on_project_watch (044 SECURITY DEFINER)",
      ui: "components/games-provider.tsx, components/notifications-page.tsx",
      linkDerive: "lib/project-nurture-links.ts → notificationTargetHref (no link column)",
    },
    migrationPolicyNotes: {
      rlsEnabled: "003 enable row level security (no FORCE RLS in migrations)",
      selectPolicy: '"Users read own notifications" — auth.uid() = user_id (003; not recreated in 039)',
      updatePolicy:
        '"Users update own notifications" — auth_is_registered_user() AND auth.uid() = user_id (039)',
      insertPolicy:
        '"Project owners insert notifications" — owner + allowed types (044 latest)',
      deletePolicy: "none for authenticated users; anonymize_own_account_data SECURITY DEFINER deletes",
    },
    grantProbes,
    interpretation: {
      authenticatedSelectBlocked:
        grantProbes.authenticated.select.code === "42501" ||
        /permission denied/i.test(grantProbes.authenticated.select.message ?? ""),
      serviceRoleDirectDml:
        grantProbes.service_role.select.ok ||
        grantProbes.service_role.insert.ok ||
        grantProbes.service_role.delete?.ok,
    },
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(JSON.stringify({ fatal: true, message: String(e?.message || e) }, null, 2));
  process.exit(2);
});
