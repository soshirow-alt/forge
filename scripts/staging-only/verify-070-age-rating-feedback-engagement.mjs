/**
 * Staging verify for 070/071 feedback engagement + age_rating.
 * HARD GUARD: vuqpwvjvgyxffmvpfrxo only.
 *
 * node --env-file=.env.local scripts/staging-only/verify-070-age-rating-feedback-engagement.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";

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
  console.error(JSON.stringify({ blocked: true, ref, expected: STAGING_REF }));
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

async function findPublicCards() {
  const { data: projects } = await admin
    .from("projects")
    .select("id, owner_id, title, visibility, age_rating, playable_version")
    .eq("visibility", "public")
    .limit(40);
  for (const p of projects ?? []) {
    const versions = [
      p.playable_version,
      "0.1",
      "1",
      "1.0",
    ].filter(Boolean);
    for (const v of [...new Set(versions)]) {
      const { data, error } = await anon.rpc("get_public_feedback_cards", {
        p_project_id: String(p.id),
        p_version_key: String(v),
        p_include_guest: true,
        p_limit: 20,
        p_offset: 0,
      });
      if (!error && Array.isArray(data) && data.length > 0) {
        return { project: p, version: String(v), cards: data };
      }
    }
  }
  return null;
}

async function authedClient(email, password) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr && !/already/i.test(createErr.message)) {
    throw createErr;
  }
  let userId = created?.user?.id;
  if (!userId) {
    const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    userId = listed?.users?.find((u) => u.email === email)?.id;
  }
  const { error: signErr } = await client.auth.signInWithPassword({ email, password });
  if (signErr) throw signErr;
  return { client, userId };
}

async function main() {
  // Schema
  {
    const { data, error } = await admin.from("projects").select("id, age_rating").limit(5);
    check("projects.age_rating column", !error, error?.message);
    if (data?.length) {
      check(
        "existing age_rating values valid",
        data.every((r) => r.age_rating === "general" || r.age_rating === "r18"),
        data.map((r) => r.age_rating),
      );
    }
  }

  {
    const row = (await admin.from("projects").select("id, age_rating").limit(1).maybeSingle())
      .data;
    if (row?.id) {
      const { error } = await admin
        .from("projects")
        .update({ age_rating: "adult" })
        .eq("id", row.id);
      check("CHECK rejects invalid age_rating", Boolean(error), error?.message);
      await admin.from("projects").update({ age_rating: row.age_rating }).eq("id", row.id);
    }
  }

  {
    const { error } = await anon.from("feedback_card_empathies").select("id").limit(1);
    check(
      "feedback_card_empathies exists (anon blocked or empty)",
      error == null || /permission|policy|RLS/i.test(error.message),
      error?.message ?? "readable",
    );
  }

  const probe = await findPublicCards();
  check("public feedback cards found", Boolean(probe), probe ? `n=${probe.cards.length}` : null);
  if (!probe) {
    console.log(JSON.stringify({ ref, results }, null, 2));
    process.exit(1);
  }

  const sample = probe.cards[0];
  check(
    "070 enrichment columns present",
    [
      "empathy_count",
      "reply_count",
      "viewer_has_empathy",
      "viewer_can_empathy",
      "developer_marked_helpful",
      "viewer_is_project_owner",
      "viewer_can_reply",
      "target_source",
      "target_id",
    ].every((k) => k in sample),
    Object.keys(sample),
  );

  // Anon write denial
  for (const [name, fn] of [
    [
      "anon toggle empathy denied",
      () =>
        anon.rpc("toggle_feedback_card_empathy", {
          p_project_id: String(probe.project.id),
          p_version_key: probe.version,
          p_card_id: sample.card_id,
        }),
    ],
    [
      "anon create reply denied",
      () =>
        anon.rpc("create_feedback_card_reply", {
          p_project_id: String(probe.project.id),
          p_version_key: probe.version,
          p_card_id: sample.card_id,
          p_body: "x",
        }),
    ],
    [
      "anon toggle helpful denied",
      () =>
        anon.rpc("toggle_feedback_card_helpful", {
          p_project_id: String(probe.project.id),
          p_version_key: probe.version,
          p_card_id: sample.card_id,
        }),
    ],
  ]) {
    const { error } = await fn();
    check(name, Boolean(error), error?.message);
  }

  // Forged card id as authenticated non-owner
  const stamp = Date.now();
  const password = `Verify070!${stamp}`;
  const third = await authedClient(`verify070-third-${stamp}@example.com`, password);
  const authorish = await authedClient(`verify070-author-${stamp}@example.com`, password);

  {
    const { error } = await third.client.rpc("toggle_feedback_card_empathy", {
      p_project_id: String(probe.project.id),
      p_version_key: probe.version,
      p_card_id: "fc1_00000000000000000000000000000000",
    });
    check("forged card_id empathy rejected", Boolean(error), error?.message);
  }

  {
    const { error } = await third.client.rpc("create_feedback_card_reply", {
      p_project_id: String(probe.project.id),
      p_version_key: probe.version,
      p_card_id: sample.card_id,
      p_body: "third party should fail",
    });
    check("third-party reply rejected", Boolean(error), error?.message);
  }

  {
    const { error } = await third.client.rpc("toggle_feedback_card_helpful", {
      p_project_id: String(probe.project.id),
      p_version_key: probe.version,
      p_card_id: sample.card_id,
    });
    check("non-owner helpful rejected", Boolean(error), error?.message);
  }

  {
    const { error } = await third.client.rpc("create_feedback_card_reply", {
      p_project_id: String(probe.project.id),
      p_version_key: probe.version,
      p_card_id: sample.card_id,
      p_body: "x".repeat(201),
    });
    check("reply body >200 rejected", Boolean(error), error?.message);
  }

  // Direct table DML (must stay denied; 071 hardens policies + REVOKEs)
  {
    const fakeTarget = "00000000-0000-4000-8000-000000000099";
    const ins = await third.client.from("feedback_card_empathies").insert({
      project_id: String(probe.project.id),
      target_source: "registered_voice",
      target_id: fakeTarget,
      user_id: third.userId,
    });
    check(
      "direct empathy INSERT blocked",
      Boolean(ins.error),
      ins.error?.message ?? "ALLOWED — apply 071",
    );
    const del = await third.client
      .from("feedback_card_empathies")
      .delete()
      .eq("target_id", fakeTarget);
    check(
      "direct empathy DELETE blocked",
      Boolean(del.error),
      del.error?.message ?? "ALLOWED — apply 071",
    );
    const upd = await third.client
      .from("feedback_card_empathies")
      .update({ project_id: String(probe.project.id) })
      .eq("target_id", fakeTarget);
    check(
      "direct empathy UPDATE blocked",
      Boolean(upd.error),
      upd.error?.message ?? "ALLOWED — apply 071",
    );
    const sel = await third.client.from("feedback_card_empathies").select("id").limit(1);
    check(
      "direct empathy SELECT blocked (counts via RPC)",
      Boolean(sel.error),
      sel.error?.message ?? "ALLOWED — apply 071",
    );
  }

  // Empathy toggle happy path on a card not authored by third
  {
    const { data, error } = await third.client.rpc("toggle_feedback_card_empathy", {
      p_project_id: String(probe.project.id),
      p_version_key: probe.version,
      p_card_id: sample.card_id,
    });
    const row = Array.isArray(data) ? data[0] : data;
    check("third can empathy (unless own card)", !error || /own feedback/i.test(error.message), {
      error: error?.message,
      row,
    });
    if (!error && row?.viewer_has_empathy) {
      const { error: e2 } = await third.client.rpc("toggle_feedback_card_empathy", {
        p_project_id: String(probe.project.id),
        p_version_key: probe.version,
        p_card_id: sample.card_id,
      });
      check("empathy toggle off works", !e2, e2?.message);
    }
  }

  // Guest card reply capability: owner-only
  const guestCard = probe.cards.find((c) => c.target_source === "guest_voice" || c.target_source === "guest_detailed");
  if (guestCard) {
    check("guest card present in sample", true, guestCard.target_source);
    check(
      "guest card viewer_can_reply false for anon/third listing",
      guestCard.viewer_can_reply === false,
      guestCard.viewer_can_reply,
    );
    const { error } = await third.client.rpc("create_feedback_card_reply", {
      p_project_id: String(probe.project.id),
      p_version_key: probe.version,
      p_card_id: guestCard.card_id,
      p_body: "third on guest should fail",
    });
    check("third cannot reply to guest FB", Boolean(error), error?.message);
  } else {
    check(
      "guest card present in sample (optional)",
      true,
      "skipped — no guest public cards in probed projects",
    );
  }

  // Cleanup auth users
  for (const u of [third.userId, authorish.userId]) {
    if (u) await admin.auth.admin.deleteUser(u);
  }

  const failed = results.filter((r) => !r.pass);
  console.log(
    JSON.stringify(
      {
        ref,
        projectId: probe.project.id,
        version: probe.version,
        cardSources: [...new Set(probe.cards.map((c) => c.target_source))],
        summary: {
          total: results.length,
          passed: results.length - failed.length,
          failed: failed.length,
        },
        results,
      },
      null,
      2,
    ),
  );
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(JSON.stringify({ fatal: true, message: String(e?.message || e) }));
  process.exit(2);
});
