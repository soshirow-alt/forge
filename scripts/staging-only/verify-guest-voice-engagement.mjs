/**
 * Staging guest_voice engagement verify (070-era RPCs).
 * HARD GUARD: vuqpwvjvgyxffmvpfrxo
 *
 * Prerequisite: paste scripts/staging-only/sql/staging-guest-voice-engagement-seed.sql
 * in Staging Dashboard (grants + fixture). NOT the same as applying 071.
 *
 * Usage:
 *   node --env-file=.env.local scripts/staging-only/verify-guest-voice-engagement.mjs
 *   node --env-file=.env.local scripts/staging-only/verify-guest-voice-engagement.mjs --cleanup
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";
const FIXTURE_PROJECT = "b0710000-0000-4000-8000-000000000071";
const FIXTURE_VERSION = "0.1";
const FIXTURE_GUEST_ID = "b0710000-0000-4000-8000-000000000073";
const OWNER_ID = "4bdc4a2f-2a39-4599-a14c-91303310ef56";

function loadEnv() {
  const env = { ...process.env };
  for (const path of [".env.local", ".env"]) {
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq <= 0) continue;
      const k = t.slice(0, eq).trim();
      let v = t.slice(eq + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
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
if (ref !== STAGING_REF) {
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
function check(name, pass, detail = null) {
  results.push({ name, pass: Boolean(pass), detail });
}

async function authed(email, password) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr && !/already/i.test(createErr.message)) throw createErr;
  let userId = created?.user?.id;
  if (!userId) {
    const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    userId = listed?.users?.find((u) => u.email === email)?.id;
  }
  const { error: signErr } = await client.auth.signInWithPassword({ email, password });
  if (signErr) throw signErr;
  return { client, userId };
}

async function cleanup() {
  await admin
    .from("feedback_card_replies")
    .delete()
    .eq("project_id", FIXTURE_PROJECT);
  await admin
    .from("feedback_card_empathies")
    .delete()
    .eq("project_id", FIXTURE_PROJECT);
  await admin.from("user_notifications").delete().eq("project_id", FIXTURE_PROJECT);
  await admin
    .from("project_guest_voice_responses")
    .delete()
    .eq("project_id", FIXTURE_PROJECT);
  await admin
    .from("project_version_prompts")
    .delete()
    .eq("project_id", FIXTURE_PROJECT);
  await admin.from("projects").delete().eq("id", FIXTURE_PROJECT);

  const orphans = {
    replies: (
      await admin
        .from("feedback_card_replies")
        .select("id")
        .eq("project_id", FIXTURE_PROJECT)
    ).data?.length,
    empathies: (
      await admin
        .from("feedback_card_empathies")
        .select("id")
        .eq("project_id", FIXTURE_PROJECT)
    ).data?.length,
    guests: (
      await admin
        .from("project_guest_voice_responses")
        .select("id")
        .eq("project_id", FIXTURE_PROJECT)
    ).data?.length,
    project: (await admin.from("projects").select("id").eq("id", FIXTURE_PROJECT).maybeSingle())
      .data,
  };
  return orphans;
}

async function main() {
  const doCleanup = process.argv.includes("--cleanup");

  // Player path: guest write API is intentionally disabled (2026-07-13).
  const previewBase =
    env.PREVIEW_BASE_URL ||
    "https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app";
  try {
    const res = await fetch(
      `${previewBase}/api/projects/${FIXTURE_PROJECT}/guest-voice`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionKey: "0.1", answers: [] }),
      },
    );
    const body = await res.json().catch(() => ({}));
    check(
      "Preview guest-voice API disabled (expected since 2026-07-13)",
      res.status === 403 && body.code === "guest_feedback_disabled",
      { status: res.status, code: body.code },
    );
  } catch (e) {
    check("Preview guest-voice API probe", false, String(e?.message || e));
  }

  if (doCleanup) {
    const orphans = await cleanup();
    check(
      "cleanup leaves no fixture orphans",
      !orphans.project &&
        (orphans.replies ?? 0) === 0 &&
        (orphans.empathies ?? 0) === 0 &&
        (orphans.guests ?? 0) === 0,
      orphans,
    );
    console.log(JSON.stringify({ ref, mode: "cleanup", results }, null, 2));
    process.exit(results.every((r) => r.pass) ? 0 : 1);
  }

  const guestSel = await admin
    .from("project_guest_voice_responses")
    .select("id, optional_comment, answer_value, moderation_status")
    .eq("id", FIXTURE_GUEST_ID)
    .maybeSingle();

  if (guestSel.error || !guestSel.data) {
    check(
      "fixture guest_voice present (seed SQL required)",
      false,
      guestSel.error?.message ??
        "missing — paste scripts/staging-only/sql/staging-guest-voice-engagement-seed.sql",
    );
    console.log(JSON.stringify({ ref, blocked: "seed_required", results }, null, 2));
    process.exit(2);
  }

  check(
    "seeded optional_comment length is 1000",
    (guestSel.data.optional_comment || "").length === 1000,
    (guestSel.data.optional_comment || "").length,
  );

  // 1001 reject on answer_value (CHECK from 070)
  {
    const { error } = await admin.from("project_guest_voice_responses").insert({
      project_id: FIXTURE_PROJECT,
      version_key: FIXTURE_VERSION,
      prompt_id: "b0710000-0000-4000-8000-000000000072",
      submitter_key: randomUUID(),
      answer_value: "x".repeat(1001),
      answer_label: null,
      optional_comment: null,
      include_in_public_aggregate: true,
      moderation_status: "visible",
    });
    check("answer_value 1001 rejected", Boolean(error), error?.message);
  }

  // optional_comment 1001 — may pass until 071 optional_comment cap is applied
  {
    const { data, error } = await admin
      .from("project_guest_voice_responses")
      .insert({
        project_id: FIXTURE_PROJECT,
        version_key: FIXTURE_VERSION,
        prompt_id: "b0710000-0000-4000-8000-000000000072",
        submitter_key: randomUUID(),
        answer_value: "no",
        answer_label: "いいえ",
        optional_comment: "y".repeat(1001),
        include_in_public_aggregate: false,
        moderation_status: "visible",
      })
      .select("id")
      .maybeSingle();
    if (data?.id) {
      await admin.from("project_guest_voice_responses").delete().eq("id", data.id);
    }
    check(
      "optional_comment 1001 status recorded",
      true,
      error
        ? `REJECTED: ${error.message}`
        : "ACCEPTED (DB still allows <=2000 until 071 optional_comment cap)",
    );
  }

  const { data: cards, error: cardsErr } = await anon.rpc("get_public_feedback_cards", {
    p_project_id: FIXTURE_PROJECT,
    p_version_key: FIXTURE_VERSION,
    p_include_guest: true,
    p_limit: 20,
    p_offset: 0,
  });
  check("public cards RPC with include_guest", !cardsErr && Array.isArray(cards), cardsErr?.message);
  const guestCard = (cards ?? []).find((c) => c.target_source === "guest_voice");
  check("guest_voice card visible via RPC include_guest=true", Boolean(guestCard), guestCard?.card_id);

  const { data: cardsHidden } = await anon.rpc("get_public_feedback_cards", {
    p_project_id: FIXTURE_PROJECT,
    p_version_key: FIXTURE_VERSION,
    p_include_guest: false,
    p_limit: 20,
    p_offset: 0,
  });
  check(
    "include_guest=false hides guest cards (app default)",
    !(cardsHidden ?? []).some((c) => c.target_source === "guest_voice"),
    (cardsHidden ?? []).map((c) => c.target_source),
  );

  const stamp = Date.now();
  const third = await authed(`gv-third-${stamp}@example.com`, `GvThird!${stamp}`);
  const ownerClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // Owner may not have password in env — create ephemeral owner session only if we can
  // Prefer linking to existing owner via admin generateLink is heavy; create second user and
  // temporarily cannot act as real owner unless we know password.
  // Use service-role impersonation alternative: update project owner to third for reply tests? No — destructive.
  // Instead: create reply as third → expect deny; create owner user clone by signing in if magic not available.
  // Staging smoke owner password unknown → use admin to set password temporarily.
  const ownerEmail = `gv-owner-${stamp}@example.com`;
  const ownerPass = `GvOwner!${stamp}`;
  await admin.auth.admin.createUser({
    email: ownerEmail,
    password: ownerPass,
    email_confirm: true,
  });
  const { data: ownerUser } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const ownerAuthId = ownerUser?.users?.find((u) => u.email === ownerEmail)?.id;
  // Point fixture project at this ephemeral owner for reply authz tests, restore after.
  const prevOwner = (
    await admin.from("projects").select("owner_id").eq("id", FIXTURE_PROJECT).maybeSingle()
  ).data?.owner_id;
  await admin.from("projects").update({ owner_id: ownerAuthId }).eq("id", FIXTURE_PROJECT);
  await ownerClient.auth.signInWithPassword({ email: ownerEmail, password: ownerPass });

  // Empathy by third
  const { data: empOn, error: empOnErr } = await third.client.rpc("toggle_feedback_card_empathy", {
    p_project_id: FIXTURE_PROJECT,
    p_version_key: FIXTURE_VERSION,
    p_card_id: guestCard.card_id,
  });
  check("third can add empathy", !empOnErr && empOn?.[0]?.viewer_has_empathy === true, empOnErr?.message ?? empOn);

  const { data: empOff, error: empOffErr } = await third.client.rpc("toggle_feedback_card_empathy", {
    p_project_id: FIXTURE_PROJECT,
    p_version_key: FIXTURE_VERSION,
    p_card_id: guestCard.card_id,
  });
  check(
    "third can remove empathy",
    !empOffErr && empOff?.[0]?.viewer_has_empathy === false,
    empOffErr?.message ?? empOff,
  );
  // leave empathy on for count checks
  await third.client.rpc("toggle_feedback_card_empathy", {
    p_project_id: FIXTURE_PROJECT,
    p_version_key: FIXTURE_VERSION,
    p_card_id: guestCard.card_id,
  });

  // Third reply denied
  const { error: thirdReplyErr } = await third.client.rpc("create_feedback_card_reply", {
    p_project_id: FIXTURE_PROJECT,
    p_version_key: FIXTURE_VERSION,
    p_card_id: guestCard.card_id,
    p_body: "third should fail",
  });
  check("third reply rejected", /not allowed/i.test(thirdReplyErr?.message || ""), thirdReplyErr?.message);

  // Owner reply 200 ok, 201 reject
  const body200 = "r".repeat(200);
  const { data: replyId, error: replyErr } = await ownerClient.rpc("create_feedback_card_reply", {
    p_project_id: FIXTURE_PROJECT,
    p_version_key: FIXTURE_VERSION,
    p_card_id: guestCard.card_id,
    p_body: body200,
  });
  check("owner reply 200 saved", !replyErr && Boolean(replyId), replyErr?.message ?? replyId);

  const { error: reply201Err } = await ownerClient.rpc("create_feedback_card_reply", {
    p_project_id: FIXTURE_PROJECT,
    p_version_key: FIXTURE_VERSION,
    p_card_id: guestCard.card_id,
    p_body: "r".repeat(201),
  });
  check("owner reply 201 rejected", /invalid reply body/i.test(reply201Err?.message || ""), reply201Err?.message);

  // Guest author has no user_id → no guest notify; owner self-notify skipped
  const { data: notifs } = await admin
    .from("user_notifications")
    .select("id, user_id, type")
    .eq("project_id", FIXTURE_PROJECT)
    .eq("type", "feedback_reply");
  check(
    "owner reply creates no guest/self notification",
    (notifs ?? []).length === 0,
    notifs,
  );

  const { data: cardsAfter } = await anon.rpc("get_public_feedback_cards", {
    p_project_id: FIXTURE_PROJECT,
    p_version_key: FIXTURE_VERSION,
    p_include_guest: true,
    p_limit: 5,
    p_offset: 0,
  });
  const after = (cardsAfter ?? []).find((c) => c.card_id === guestCard.card_id);
  check("reply_count reflected on card", Number(after?.reply_count) >= 1, after?.reply_count);
  check("empathy_count reflected on card", Number(after?.empathy_count) >= 1, after?.empathy_count);

  if (replyId) {
    await ownerClient.rpc("delete_feedback_card_reply", { p_reply_id: replyId });
    const { data: cardsDel } = await anon.rpc("get_public_feedback_cards", {
      p_project_id: FIXTURE_PROJECT,
      p_version_key: FIXTURE_VERSION,
      p_include_guest: true,
      p_limit: 5,
      p_offset: 0,
    });
    const afterDel = (cardsDel ?? []).find((c) => c.card_id === guestCard.card_id);
    check("reply_count decreases after delete", Number(afterDel?.reply_count) === 0, afterDel?.reply_count);
  }

  // Parent delete cleans side tables via trigger
  await admin.from("project_guest_voice_responses").delete().eq("id", FIXTURE_GUEST_ID);
  const { data: cardsGone } = await anon.rpc("get_public_feedback_cards", {
    p_project_id: FIXTURE_PROJECT,
    p_version_key: FIXTURE_VERSION,
    p_include_guest: true,
    p_limit: 5,
    p_offset: 0,
  });
  check(
    "after parent delete, guest card gone from public RPC",
    !(cardsGone ?? []).some((c) => c.target_id === FIXTURE_GUEST_ID),
    cardsGone,
  );
  const { data: empLeft } = await admin
    .from("feedback_card_empathies")
    .select("id")
    .eq("target_id", FIXTURE_GUEST_ID);
  const { data: repLeft } = await admin
    .from("feedback_card_replies")
    .select("id")
    .eq("target_id", FIXTURE_GUEST_ID);
  check("empathies cleaned after parent delete", (empLeft ?? []).length === 0, empLeft);
  check("replies cleaned after parent delete", (repLeft ?? []).length === 0, repLeft);

  // Private project hides from anon
  await admin.from("projects").update({ visibility: "private" }).eq("id", FIXTURE_PROJECT);
  // Re-seed a guest row briefly for private check
  await admin.from("project_guest_voice_responses").insert({
    id: FIXTURE_GUEST_ID,
    project_id: FIXTURE_PROJECT,
    version_key: FIXTURE_VERSION,
    prompt_id: "b0710000-0000-4000-8000-000000000072",
    submitter_key: "b0710000-0000-4000-8000-000000000074",
    answer_value: "yes",
    answer_label: "はい",
    optional_comment: "private-check",
    include_in_public_aggregate: true,
    moderation_status: "visible",
  });
  const { data: privateCards } = await anon.rpc("get_public_feedback_cards", {
    p_project_id: FIXTURE_PROJECT,
    p_version_key: FIXTURE_VERSION,
    p_include_guest: true,
    p_limit: 5,
    p_offset: 0,
  });
  check(
    "private project: anon gets no public guest cards",
    (privateCards ?? []).length === 0,
    privateCards,
  );

  // Restore owner and cleanup fixture
  if (prevOwner) {
    await admin.from("projects").update({ owner_id: prevOwner, visibility: "public" }).eq("id", FIXTURE_PROJECT);
  }
  const orphans = await cleanup();
  check(
    "final cleanup no orphans",
    !orphans.project &&
      (orphans.replies ?? 0) === 0 &&
      (orphans.empathies ?? 0) === 0 &&
      (orphans.guests ?? 0) === 0,
    orphans,
  );

  if (third.userId) await admin.auth.admin.deleteUser(third.userId);
  if (ownerAuthId) await admin.auth.admin.deleteUser(ownerAuthId);

  const failed = results.filter((r) => !r.pass);
  console.log(JSON.stringify({ ref, previewBase, results, failed: failed.length }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(JSON.stringify({ fatal: true, message: String(e?.message || e) }));
  process.exit(2);
});
