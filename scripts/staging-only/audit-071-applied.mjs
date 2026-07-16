/**
 * Post-071 Staging schema/behavior audit (read-only + ephemeral probes).
 * HARD GUARD: vuqpwvjvgyxffmvpfrxo
 *
 * node --env-file=.env.local scripts/staging-only/audit-071-applied.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

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
const ref = new URL(url).hostname.split(".")[0];
if (ref !== STAGING) {
  console.error(JSON.stringify({ blocked: true, ref }));
  process.exit(2);
}

const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anon = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const out = { ref, checks: [], objects: {} };

function check(name, pass, detail = null) {
  out.checks.push({ name, pass: Boolean(pass), detail });
}

async function main() {
  // --- optional_comment 1000 CHECK via probe insert (registered) ---
  const { data: prompts } = await admin
    .from("project_version_prompts")
    .select("id, project_id, version_key")
    .limit(1);
  const prompt = prompts?.[0];
  const stamp = Date.now();
  const { data: userWrap, error: userErr } = await admin.auth.admin.createUser({
    email: `audit071-${stamp}@example.com`,
    password: `Audit071!${stamp}`,
    email_confirm: true,
  });
  if (userErr) throw userErr;
  const uid = userWrap.user.id;

  // Count voice rows before probes (no truncate check baseline)
  const beforeVoice = await admin
    .from("project_voice_responses")
    .select("id", { count: "exact", head: true });
  const beforeProjects = await admin
    .from("projects")
    .select("id, age_rating", { count: "exact" });

  // 1001 optional_comment should fail CHECK
  if (prompt) {
    const { error: e1001 } = await admin.from("project_voice_responses").insert({
      user_id: uid,
      project_id: prompt.project_id,
      version_key: prompt.version_key,
      prompt_id: prompt.id,
      answer_value: "yes",
      answer_label: "はい",
      optional_comment: "x".repeat(1001),
      moderation_status: "visible",
    });
    check(
      "optional_comment 1001 rejected (registered)",
      Boolean(e1001),
      e1001?.message ?? e1001?.code,
    );

    const { data: ok1000, error: e1000 } = await admin
      .from("project_voice_responses")
      .insert({
        user_id: uid,
        project_id: prompt.project_id,
        version_key: prompt.version_key,
        prompt_id: prompt.id,
        answer_value: "yes",
        answer_label: "はい",
        optional_comment: "y".repeat(1000),
        moderation_status: "visible",
      })
      .select("id, optional_comment")
      .maybeSingle();
    check(
      "optional_comment 1000 accepted (registered)",
      !e1000 && (ok1000?.optional_comment?.length === 1000),
      e1000?.message ?? ok1000?.optional_comment?.length,
    );
    if (ok1000?.id) {
      await admin.from("project_voice_responses").delete().eq("id", ok1000.id);
    }
  }

  // age_rating CHECK
  const sampleProject = (beforeProjects.data ?? []).find((p) => p.id);
  if (sampleProject) {
    const orig = sampleProject.age_rating;
    const { error: badAge } = await admin
      .from("projects")
      .update({ age_rating: "adult" })
      .eq("id", sampleProject.id);
    check("age_rating invalid rejected", Boolean(badAge), badAge?.message);
    await admin.from("projects").update({ age_rating: orig }).eq("id", sampleProject.id);

    const { error: toR18 } = await admin
      .from("projects")
      .update({ age_rating: "r18" })
      .eq("id", sampleProject.id);
    const { data: r18row } = await admin
      .from("projects")
      .select("age_rating")
      .eq("id", sampleProject.id)
      .maybeSingle();
    check("age_rating r18 save", !toR18 && r18row?.age_rating === "r18", r18row?.age_rating);
    const { error: toGen } = await admin
      .from("projects")
      .update({ age_rating: "general" })
      .eq("id", sampleProject.id);
    const { data: genRow } = await admin
      .from("projects")
      .select("age_rating")
      .eq("id", sampleProject.id)
      .maybeSingle();
    check("age_rating general save", !toGen && genRow?.age_rating === "general", genRow?.age_rating);
    // restore
    await admin.from("projects").update({ age_rating: orig }).eq("id", sampleProject.id);
  }

  const afterVoice = await admin
    .from("project_voice_responses")
    .select("id", { count: "exact", head: true });
  check(
    "no net voice row loss from probes",
    (beforeVoice.count ?? 0) === (afterVoice.count ?? 0),
    { before: beforeVoice.count, after: afterVoice.count },
  );

  // Existing age_rating distribution
  const ratings = (beforeProjects.data ?? []).map((p) => p.age_rating);
  check(
    "existing age_rating only general|r18",
    ratings.every((r) => r === "general" || r === "r18"),
    [...new Set(ratings)],
  );

  // Empathy table DML for roles
  const authed = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await authed.auth.signInWithPassword({
    email: `audit071-${stamp}@example.com`,
    password: `Audit071!${stamp}`,
  });

  const fake = {
    project_id: "00000000-0000-4000-8000-000000000001",
    target_source: "registered_voice",
    target_id: "00000000-0000-4000-8000-000000000002",
    user_id: uid,
  };

  for (const [role, client] of [
    ["anon", anon],
    ["authenticated", authed],
    ["service_role", admin],
  ]) {
    const sel = await client.from("feedback_card_empathies").select("id").limit(1);
    const ins = await client.from("feedback_card_empathies").insert(fake).select("id").maybeSingle();
    if (ins.data?.id) {
      await admin.from("feedback_card_empathies").delete().eq("id", ins.data.id);
    }
    const del = await client
      .from("feedback_card_empathies")
      .delete()
      .eq("id", "00000000-0000-4000-8000-000000000099");
    const upd = await client
      .from("feedback_card_empathies")
      .update({ project_id: fake.project_id })
      .eq("id", "00000000-0000-4000-8000-000000000099");
    out.objects[`empathy_dml_${role}`] = {
      select: sel.error?.message ?? "OK",
      insert: ins.error?.message ?? "OK",
      delete: del.error?.message ?? "OK",
      update: upd.error?.message ?? "OK",
    };
    check(
      `${role} empathy table DML denied`,
      Boolean(sel.error) && Boolean(ins.error) && Boolean(del.error) && Boolean(upd.error),
      out.objects[`empathy_dml_${role}`],
    );
  }

  // RPC execute grants
  const anonToggle = await anon.rpc("toggle_feedback_card_empathy", {
    p_project_id: "x",
    p_version_key: "0.1",
    p_card_id: "fc1_x",
  });
  check(
    "anon cannot execute toggle_feedback_card_empathy",
    Boolean(anonToggle.error),
    anonToggle.error?.message,
  );

  // Functions exist via successful/meaningful errors (not schema cache miss)
  for (const [name, args] of [
    ["get_public_feedback_cards", { p_project_id: "x", p_version_key: "0.1", p_include_guest: true, p_limit: 1, p_offset: 0 }],
    ["toggle_feedback_card_empathy", { p_project_id: "x", p_version_key: "0.1", p_card_id: "fc1_x" }],
    ["toggle_feedback_card_helpful", { p_project_id: "x", p_version_key: "0.1", p_card_id: "fc1_x" }],
    ["list_feedback_card_replies", { p_project_id: "x", p_version_key: "0.1", p_card_id: "fc1_x" }],
    ["create_feedback_card_reply", { p_project_id: "x", p_version_key: "0.1", p_card_id: "fc1_x", p_body: "a" }],
    ["delete_feedback_card_reply", { p_reply_id: randomUUID() }],
  ]) {
    const { error } = await authed.rpc(name, args);
    const missing = /Could not find the function|schema cache/i.test(error?.message || "");
    check(`function ${name} present`, !missing, error?.message ?? "callable");
  }

  // Guest include forced false
  const { data: projects } = await admin
    .from("projects")
    .select("id, playable_version")
    .eq("visibility", "public")
    .limit(20);
  let guestSeen = 0;
  let registeredSeen = 0;
  for (const p of projects ?? []) {
    const { data } = await anon.rpc("get_public_feedback_cards", {
      p_project_id: String(p.id),
      p_version_key: String(p.playable_version || "0.1"),
      p_include_guest: true,
      p_limit: 50,
      p_offset: 0,
    });
    for (const c of data ?? []) {
      if (c.target_source === "guest_voice" || c.target_source === "guest_detailed") guestSeen += 1;
      if (c.target_source === "registered_voice" || c.target_source === "registered_detailed")
        registeredSeen += 1;
    }
  }
  check("p_include_guest=true returns zero guest cards", guestSeen === 0, {
    guestSeen,
    registeredSeen,
  });

  // Guest card_id engagement denied (opaque id that would be guest format if resolved)
  // Use feedback_public_card_id via forging: if resolve excludes guest, any real guest id fails as not found
  // Probe with known guest table inaccessible — forge card id string
  const guestish = "fc1_" + "0".repeat(32);
  for (const [rpc, args] of [
    [
      "toggle_feedback_card_empathy",
      { p_project_id: String(projects?.[0]?.id), p_version_key: "0.1", p_card_id: guestish },
    ],
    [
      "toggle_feedback_card_helpful",
      { p_project_id: String(projects?.[0]?.id), p_version_key: "0.1", p_card_id: guestish },
    ],
    [
      "create_feedback_card_reply",
      {
        p_project_id: String(projects?.[0]?.id),
        p_version_key: "0.1",
        p_card_id: guestish,
        p_body: "x",
      },
    ],
  ]) {
    const { error } = await authed.rpc(rpc, args);
    check(
      `${rpc} rejects unresolved/guest card`,
      Boolean(error),
      error?.message,
    );
  }

  const listGuest = await anon.rpc("list_feedback_card_replies", {
    p_project_id: String(projects?.[0]?.id),
    p_version_key: "0.1",
    p_card_id: guestish,
  });
  check(
    "list_feedback_card_replies empty/denied for guestish card",
    !listGuest.error && (listGuest.data ?? []).length === 0,
    { error: listGuest.error?.message, n: (listGuest.data ?? []).length },
  );

  // Inferred schema state (behavioral)
  out.objects.inferred = {
    optional_comment_max: 1000,
    empathy_policies_direct_access: "none detectable (all role DML denied)",
    empathy_grants_anon_authenticated_service_role: "no usable table DML/SELECT",
    toggle_empathy_execute: { authenticated: "yes (callable)", anon: "denied", public: "n/a via REST" },
    search_path: "cannot read pg_proc via REST; 071 SQL SET search_path = public on DEFINER funcs",
    get_public_feedback_cards_guest: "forced excluded (behavioral)",
  };

  await admin.auth.admin.deleteUser(uid);

  const failed = out.checks.filter((c) => !c.pass);
  console.log(JSON.stringify({ ...out, failed: failed.length }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(JSON.stringify({ fatal: true, message: String(e?.message || e) }));
  process.exit(2);
});
