/**
 * OPTIONAL Owner-run Staging write probe for project_watches grants + RLS.
 * Creates temporary auth users and INSERT/DELETE watches, then deletes users.
 *
 * Default Cursor verification for 102/103 is READ-ONLY SQL / MCP post-check.
 * This script is not part of the default agent path.
 *
 * Usage (Owner / explicit):
 *   node --env-file=.env.local scripts/staging-only/verify-watch-update-102-103-gate.mjs
 */
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
if (!url || !serviceKey || !anonKey) {
  console.error(
    "Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
  process.exit(1);
}
if (!url.includes("vuqpwvjvgyxffmvpfrxo")) {
  console.error("Refusing: not Staging project URL", url);
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const stamp = Date.now().toString(36);
const emailA = `watch-gate-a-${stamp}@forge-staging.invalid`;
const emailB = `watch-gate-b-${stamp}@forge-staging.invalid`;
const password = `Gate-${stamp}-Aa1!`;
const markerProject = `watch-gate-${stamp}`;

async function createUser(email) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user;
}

async function clientAs(email) {
  const c = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return c;
}

async function mustOk(label, result) {
  if (result?.error) {
    throw new Error(`${label}: ${result.error.message || result.error}`);
  }
  return result;
}

let userA;
let userB;
let failed = false;

try {
  userA = await createUser(emailA);
  userB = await createUser(emailB);
  const clientA = await clientAs(emailA);
  const clientB = await clientAs(emailB);

  {
    const { error } = await clientA.from("project_watches").insert({
      user_id: userA.id,
      project_id: markerProject,
    });
    assert.equal(error, null, `A insert own watch: ${error?.message}`);
  }

  {
    const { data, error } = await clientA
      .from("project_watches")
      .select("project_id")
      .eq("project_id", markerProject);
    assert.equal(error, null, error?.message);
    assert.equal(data?.length, 1);
  }

  {
    const { error } = await clientA.from("project_watches").insert({
      user_id: userA.id,
      project_id: markerProject,
    });
    assert.ok(error, "expected duplicate watch error");
    assert.match(String(error.code || error.message), /23505|duplicate/i);
  }

  {
    const { error } = await clientB.from("project_watches").insert({
      user_id: userA.id,
      project_id: `${markerProject}-x`,
    });
    assert.ok(error, "B must not insert as A");
  }

  {
    await clientB
      .from("project_watches")
      .delete()
      .eq("user_id", userA.id)
      .eq("project_id", markerProject);
    const { data } = await clientA
      .from("project_watches")
      .select("project_id")
      .eq("project_id", markerProject);
    assert.equal(data?.length, 1, "A watch must remain after B delete attempt");
  }

  {
    const { error } = await clientA
      .from("project_watches")
      .delete()
      .eq("user_id", userA.id)
      .eq("project_id", markerProject);
    assert.equal(error, null, error?.message);
    const { data } = await clientA
      .from("project_watches")
      .select("project_id")
      .eq("project_id", markerProject);
    assert.equal(data?.length ?? 0, 0);
  }
} catch (err) {
  failed = true;
  console.error("FAIL", err);
  process.exitCode = 1;
} finally {
  const leftovers = [];
  try {
    if (userA?.id) {
      await mustOk(
        "cleanup A watches",
        await admin.from("project_watches").delete().eq("user_id", userA.id),
      );
      await mustOk(
        "cleanup A user",
        await admin.auth.admin.deleteUser(userA.id),
      );
    }
    if (userB?.id) {
      await mustOk(
        "cleanup B watches",
        await admin.from("project_watches").delete().eq("user_id", userB.id),
      );
      await mustOk(
        "cleanup B user",
        await admin.auth.admin.deleteUser(userB.id),
      );
    }
  } catch (cleanupErr) {
    failed = true;
    leftovers.push(String(cleanupErr));
    console.error("CLEANUP FAIL", cleanupErr);
    process.exitCode = 1;
  }

  if (!failed) {
    console.log("PASS verify-watch-update-102-103-gate (watches RLS/GRANT)");
    console.log(
      "NOTE: coalesce unique (103) verified via Staging SQL unique_violation DO block",
    );
  } else if (leftovers.length) {
    console.error("Leftover cleanup issues:", leftovers.join("; "));
  }
}
