/**
 * Staging: user_notifications INSERT policy attack probes (run AFTER 073 apply).
 * HARD GUARD: vuqpwvjvgyxffmvpfrxo — ephemeral users/rows only.
 *
 * node --env-file=.env.local scripts/staging-only/verify-user-notifications-insert-attacks.mjs
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
if (ref !== STAGING) process.exit(2);

const admin = createClient(url, serviceKey, {
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

async function tryInsert(client, row) {
  const { error } = await client.from("user_notifications").insert(row);
  return error;
}

async function main() {
  const stamp = Date.now();
  const password = `Atk!${stamp}`;
  const created = { users: [], watchId: null, projectId: null, prevOwner: null };

  const owner = await authed(`notif-atk-owner-${stamp}@example.com`, password);
  const watcher = await authed(`notif-atk-watch-${stamp}@example.com`, password);
  const stranger = await authed(`notif-atk-stranger-${stamp}@example.com`, password);
  created.users.push(owner.userId, watcher.userId, stranger.userId);

  const projectId = "41ff5a96-105c-42a2-87b4-787bcfeacb45";
  const { data: project } = await admin
    .from("projects")
    .select("id, owner_id, title")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) throw new Error("project missing");
  created.projectId = projectId;
  created.prevOwner = project.owner_id;
  await admin.from("projects").update({ owner_id: owner.userId }).eq("id", projectId);

  const grantProbe = await owner.client.from("user_notifications").select("id").limit(1);
  if (grantProbe.error?.code === "42501") {
    console.log(
      JSON.stringify(
        {
          ref,
          blocked: "073_not_applied",
          hint: "Apply 073_user_notifications_authenticated_read_access.sql first",
          error: grantProbe.error.message,
        },
        null,
        2,
      ),
    );
    process.exit(2);
  }

  const base = {
    project_id: projectId,
    message: `[attack-probe-${stamp}]`,
  };

  check(
    "general user INSERT denied",
    Boolean(await tryInsert(stranger.client, { ...base, user_id: watcher.userId, type: "devlog" })),
    "stranger → watcher devlog",
  );

  check(
    "non-owner INSERT denied",
    Boolean(await tryInsert(watcher.client, { ...base, user_id: owner.userId, type: "devlog" })),
    "watcher → owner devlog",
  );

  check(
    "owner wrong project INSERT denied",
    Boolean(
      await tryInsert(owner.client, {
        ...base,
        user_id: watcher.userId,
        type: "devlog",
        project_id: "00000000-0000-0000-0000-000000000099",
      }),
    ),
    "fake project id",
  );

  check(
    "owner nonexistent project INSERT denied",
    Boolean(
      await tryInsert(owner.client, {
        ...base,
        user_id: watcher.userId,
        type: "devlog",
        project_id: "00000000-0000-0000-0000-000000000099",
      }),
    ),
    "missing project",
  );

  check(
    "owner devlog to non-watcher denied",
    Boolean(
      await tryInsert(owner.client, {
        ...base,
        user_id: stranger.userId,
        type: "devlog",
      }),
    ),
    "stranger not watching",
  );

  const { error: watchErr } = await watcher.client.from("project_watches").upsert({
    user_id: watcher.userId,
    project_id: projectId,
  });
  check("watcher can watch project", !watchErr, watchErr?.message);

  const legitDevlog = await tryInsert(owner.client, {
    ...base,
    user_id: watcher.userId,
    type: "devlog",
    devlog_id: "00000000-0000-0000-0000-000000000001",
  });
  check("owner legitimate devlog to watcher succeeds", !legitDevlog, legitDevlog?.message);

  check(
    "self-notify INSERT denied",
    Boolean(
      await tryInsert(owner.client, {
        ...base,
        user_id: owner.userId,
        type: "devlog",
      }),
    ),
    "owner → self",
  );

  for (const blockedType of ["voice_received", "project_watched", "feedback_reply"]) {
    check(
      `${blockedType} direct INSERT denied`,
      Boolean(
        await tryInsert(owner.client, {
          ...base,
          user_id: watcher.userId,
          type: blockedType,
        }),
      ),
      blockedType,
    );
  }

  check(
    "followed_developer to non-follower denied",
    Boolean(
      await tryInsert(owner.client, {
        ...base,
        user_id: stranger.userId,
        type: "followed_developer_new_project",
      }),
    ),
    "stranger not follower",
  );

  await admin.from("projects").update({ owner_id: created.prevOwner }).eq("id", projectId);
  await admin.from("project_watches").delete().eq("user_id", watcher.userId).eq("project_id", projectId);
  for (const uid of created.users) {
    await admin.auth.admin.deleteUser(uid);
  }

  const failed = results.filter((r) => !r.pass);
  console.log(JSON.stringify({ ref, migration: "073", results, failed: failed.length }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(JSON.stringify({ fatal: true, message: String(e?.message || e) }, null, 2));
  process.exit(2);
});
