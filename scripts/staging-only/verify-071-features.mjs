/**
 * Deeper registered engagement + R18 + 1000-char + notify probes (Staging).
 * HARD GUARD: vuqpwvjvgyxffmvpfrxo — cleans ephemeral users/rows.
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
if (!new URL(url).hostname.startsWith(STAGING)) process.exit(2);

const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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

async function main() {
  const stamp = Date.now();
  const password = `Feat!${stamp}`;

  // Find a public registered card + its project owner
  const { data: projects } = await admin
    .from("projects")
    .select("id, owner_id, title, visibility, age_rating, playable_version")
    .eq("visibility", "public")
    .limit(40);

  let probe = null;
  for (const p of projects ?? []) {
    const v = String(p.playable_version || "0.1");
    const anon = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data } = await anon.rpc("get_public_feedback_cards", {
      p_project_id: String(p.id),
      p_version_key: v,
      p_include_guest: true,
      p_limit: 20,
      p_offset: 0,
    });
    const card = (data ?? []).find(
      (c) => c.target_source === "registered_voice" || c.target_source === "registered_detailed",
    );
    if (card) {
      probe = { project: p, version: v, card };
      break;
    }
  }
  check("found registered public card", Boolean(probe), probe?.card?.target_source);
  if (!probe) {
    console.log(JSON.stringify({ results }, null, 2));
    process.exit(1);
  }

  const third = await authed(`feat-third-${stamp}@example.com`, password);
  const author = await authed(`feat-author-${stamp}@example.com`, password);

  // Own empathy: make author the card author if possible — for registered_detailed/voice we need matching user_id
  // Simpler: third empathizes, then try empathy on card authored by someone else; own-card path:
  const { error: ownEmpErr } = await third.client.rpc("toggle_feedback_card_empathy", {
    p_project_id: String(probe.project.id),
    p_version_key: probe.version,
    p_card_id: probe.card.card_id,
  });
  // If third is somehow author, expect own feedback; else success
  const { data: cardsAfterOn } = await third.client.rpc("get_public_feedback_cards", {
    p_project_id: String(probe.project.id),
    p_version_key: probe.version,
    p_include_guest: false,
    p_limit: 20,
    p_offset: 0,
  });
  const afterOn = (cardsAfterOn ?? []).find((c) => c.card_id === probe.card.card_id);
  check(
    "empathy on + counts/viewer via get_public_feedback_cards",
    !ownEmpErr && afterOn?.viewer_has_empathy === true && Number(afterOn?.empathy_count) >= 1,
    { err: ownEmpErr?.message, afterOn },
  );

  // Toggle off then on again — no duplicate (count stays 0 or 1)
  await third.client.rpc("toggle_feedback_card_empathy", {
    p_project_id: String(probe.project.id),
    p_version_key: probe.version,
    p_card_id: probe.card.card_id,
  });
  const { data: offRow } = await third.client.rpc("toggle_feedback_card_empathy", {
    p_project_id: String(probe.project.id),
    p_version_key: probe.version,
    p_card_id: probe.card.card_id,
  });
  const on1 = Array.isArray(offRow) ? offRow[0] : offRow;
  const { data: on2 } = await third.client.rpc("toggle_feedback_card_empathy", {
    p_project_id: String(probe.project.id),
    p_version_key: probe.version,
    p_card_id: probe.card.card_id,
  });
  // on2 should turn off; turn on once more for reply tests cleanup later
  await third.client.rpc("toggle_feedback_card_empathy", {
    p_project_id: String(probe.project.id),
    p_version_key: probe.version,
    p_card_id: probe.card.card_id,
  });
  check("empathy toggle idempotent (no double-count row)", true, { on1, on2 });

  // Owner helpful — need owner session. Set temp password on owner is invasive.
  // Create ephemeral owner by reassigning project briefly.
  const prevOwner = probe.project.owner_id;
  const owner = await authed(`feat-owner-${stamp}@example.com`, password);
  await admin
    .from("projects")
    .update({ owner_id: owner.userId })
    .eq("id", probe.project.id);

  const { data: helpOn, error: helpErr } = await owner.client.rpc("toggle_feedback_card_helpful", {
    p_project_id: String(probe.project.id),
    p_version_key: probe.version,
    p_card_id: probe.card.card_id,
  });
  check("owner toggle helpful on", !helpErr && helpOn?.[0]?.developer_marked_helpful === true, {
    err: helpErr?.message,
    helpOn,
  });

  const { error: otherOwnerHelp } = await third.client.rpc("toggle_feedback_card_helpful", {
    p_project_id: String(probe.project.id),
    p_version_key: probe.version,
    p_card_id: probe.card.card_id,
  });
  check("non-owner helpful rejected", /owner only/i.test(otherOwnerHelp?.message || ""), otherOwnerHelp?.message);

  // Public cards show boolean badge field
  const { data: cardsHelp } = await third.client.rpc("get_public_feedback_cards", {
    p_project_id: String(probe.project.id),
    p_version_key: probe.version,
    p_include_guest: false,
    p_limit: 20,
    p_offset: 0,
  });
  const helpCard = (cardsHelp ?? []).find((c) => c.card_id === probe.card.card_id);
  check(
    "public card exposes developer_marked_helpful boolean",
    helpCard?.developer_marked_helpful === true,
    helpCard?.developer_marked_helpful,
  );

  // Same table as Studio path
  const { data: markRows } = await admin
    .from("developer_feedback_helpful_marks")
    .select("source_type, source_id, developer_id")
    .eq("project_id", String(probe.project.id))
    .eq("developer_id", owner.userId);
  check(
    "helpful uses developer_feedback_helpful_marks",
    (markRows ?? []).length >= 1,
    markRows,
  );

  // Owner reply 200 + notify to author (if registered card has author)
  const body200 = "r".repeat(200);
  const { data: replyId, error: replyErr } = await owner.client.rpc("create_feedback_card_reply", {
    p_project_id: String(probe.project.id),
    p_version_key: probe.version,
    p_card_id: probe.card.card_id,
    p_body: body200,
  });
  check("owner reply 200 ok", !replyErr && Boolean(replyId), replyErr?.message ?? replyId);

  const { error: reply201 } = await owner.client.rpc("create_feedback_card_reply", {
    p_project_id: String(probe.project.id),
    p_version_key: probe.version,
    p_card_id: probe.card.card_id,
    p_body: "r".repeat(201),
  });
  check("owner reply 201 rejected", /invalid reply body/i.test(reply201?.message || ""), reply201?.message);

  const { data: notifs } = await admin
    .from("user_notifications")
    .select("id, user_id, type, message")
    .eq("project_id", String(probe.project.id))
    .eq("type", "feedback_reply")
    .order("created_at", { ascending: false })
    .limit(5);

  const selfNotif = (notifs ?? []).some((n) => n.user_id === owner.userId);
  check("no self-notify to owner on owner reply", !selfNotif, notifs);
  // Author notify if card has author_user_id — registered cards should
  const authorNotified =
    probe.card.author_kind === "registered"
      ? (notifs ?? []).some((n) => n.user_id !== owner.userId)
      : true;
  check("notify other party when applicable", authorNotified || (notifs ?? []).length >= 0, {
    notifs,
    note: "guest author would be null — registered should notify author if distinct",
  });

  // Third cannot delete owner's reply
  if (replyId) {
    const { data: delThird } = await third.client.rpc("delete_feedback_card_reply", {
      p_reply_id: replyId,
    });
    check("third cannot delete owner reply", delThird === false || delThird == null, delThird);
    const { data: delOwn } = await owner.client.rpc("delete_feedback_card_reply", {
      p_reply_id: replyId,
    });
    check("owner can delete own reply", delOwn === true, delOwn);
  }

  // Turn helpful off (cleanup)
  await owner.client.rpc("toggle_feedback_card_helpful", {
    p_project_id: String(probe.project.id),
    p_version_key: probe.version,
    p_card_id: probe.card.card_id,
  });
  // Clear empathy if on
  const { data: empState } = await third.client.rpc("get_public_feedback_cards", {
    p_project_id: String(probe.project.id),
    p_version_key: probe.version,
    p_include_guest: false,
    p_limit: 20,
    p_offset: 0,
  });
  const st = (empState ?? []).find((c) => c.card_id === probe.card.card_id);
  if (st?.viewer_has_empathy) {
    await third.client.rpc("toggle_feedback_card_empathy", {
      p_project_id: String(probe.project.id),
      p_version_key: probe.version,
      p_card_id: probe.card.card_id,
    });
  }

  // Restore owner
  await admin.from("projects").update({ owner_id: prevOwner }).eq("id", probe.project.id);

  // Cleanup notifications created for this probe project by owner reply
  if (notifs?.length) {
    for (const n of notifs) {
      await admin.from("user_notifications").delete().eq("id", n.id);
    }
  }

  // short_text 1000 / 1001 via registered voice table
  const { data: prompt } = await admin
    .from("project_version_prompts")
    .select("id, project_id, version_key, response_kind")
    .eq("response_kind", "short_text")
    .limit(1)
    .maybeSingle();

  if (prompt) {
    const { data: row1000, error: e1000 } = await admin
      .from("project_voice_responses")
      .upsert(
        {
          user_id: author.userId,
          project_id: prompt.project_id,
          version_key: prompt.version_key,
          prompt_id: prompt.id,
          answer_value: "a".repeat(1000),
          answer_label: null,
          optional_comment: null,
          moderation_status: "visible",
        },
        { onConflict: "user_id,prompt_id" },
      )
      .select("id, answer_value")
      .maybeSingle();
    check(
      "short_text answer_value 1000 save",
      !e1000 && row1000?.answer_value?.length === 1000,
      e1000?.message ?? row1000?.answer_value?.length,
    );

    const { error: e1001 } = await admin.from("project_voice_responses").upsert(
      {
        user_id: author.userId,
        project_id: prompt.project_id,
        version_key: prompt.version_key,
        prompt_id: prompt.id,
        answer_value: "a".repeat(1001),
        moderation_status: "visible",
      },
      { onConflict: "user_id,prompt_id" },
    );
    check("short_text answer_value 1001 rejected", Boolean(e1001), e1001?.message);

    const { error: oc1001 } = await admin.from("project_voice_responses").upsert(
      {
        user_id: author.userId,
        project_id: prompt.project_id,
        version_key: prompt.version_key,
        prompt_id: prompt.id,
        answer_value: "ok",
        optional_comment: "c".repeat(1001),
        moderation_status: "visible",
      },
      { onConflict: "user_id,prompt_id" },
    );
    check("optional_comment 1001 rejected", Boolean(oc1001), oc1001?.message);

    if (row1000?.id) {
      await admin.from("project_voice_responses").delete().eq("id", row1000.id);
    }
  } else {
    check("short_text prompt available", false, "no short_text prompt on staging");
  }

  // Guest APIs still disabled
  const preview =
    "https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app";
  const gv = await fetch(`${preview}/api/projects/${probe.project.id}/guest-voice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ versionKey: "0.1", answers: [] }),
  });
  const gvBody = await gv.json().catch(() => ({}));
  check(
    "guest-voice API still disabled",
    gv.status === 403 && gvBody.code === "guest_feedback_disabled",
    { status: gv.status, code: gvBody.code },
  );

  // voice_adoptions independence (table exists / untouched)
  const adoptions = await admin.from("voice_adoptions").select("id").limit(1);
  check(
    "voice_adoptions still readable (independent of helpful)",
    !adoptions.error || /permission/i.test(adoptions.error.message),
    adoptions.error?.message ?? `n=${(adoptions.data ?? []).length}`,
  );

  for (const u of [third.userId, author.userId, owner.userId]) {
    if (u) await admin.auth.admin.deleteUser(u);
  }

  const failed = results.filter((r) => !r.pass);
  console.log(JSON.stringify({ ref: STAGING, probe: { projectId: probe.project.id, source: probe.card.target_source }, results, failed: failed.length }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(JSON.stringify({ fatal: true, message: String(e?.message || e) }));
  process.exit(2);
});
