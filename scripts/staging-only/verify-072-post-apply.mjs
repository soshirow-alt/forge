/**
 * Staging verify after 072 (registered answer_value <= 1000 CHECK).
 * HARD GUARD: vuqpwvjvgyxffmvpfrxo — ephemeral rows only; no bulk UPDATE/truncate.
 *
 * node --env-file=.env.local scripts/staging-only/verify-072-post-apply.mjs
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
  const { error: signErr } = await client.auth.signInWithPassword({ email, password });
  if (signErr) throw signErr;
  return { client, userId };
}

async function countAllRows() {
  const { count, error } = await admin
    .from("project_voice_responses")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

async function maxAnswerLen() {
  const { data, error } = await admin.from("project_voice_responses").select("answer_value");
  if (error) throw error;
  let max = 0;
  let over1000 = 0;
  for (const row of data ?? []) {
    const len = row.answer_value ? String(row.answer_value).length : 0;
    if (len > max) max = len;
    if (len > 1000) over1000 += 1;
  }
  return { max, over1000, scanned: (data ?? []).length };
}

async function main() {
  const stamp = Date.now();
  const password = `V072!${stamp}`;
  const created = { userIds: [], responseIds: [] };

  const rowCountBefore = await countAllRows();
  const lenBefore = await maxAnswerLen();
  check("baseline: table readable via service role", rowCountBefore >= 0, { rowCountBefore });
  check("baseline: no rows over 1000 chars", lenBefore.over1000 === 0, lenBefore);

  const author = await authed(`v072-author-${stamp}@example.com`, password);
  created.userIds.push(author.userId);

  const { data: prompts } = await admin
    .from("project_version_prompts")
    .select("id, project_id, version_key, response_kind")
    .in("response_kind", ["short_text", "choice", "yes_no", "scale_3"])
    .is("archived_at", null)
    .limit(20);

  const byKind = {};
  for (const p of prompts ?? []) {
    if (!byKind[p.response_kind]) byKind[p.response_kind] = p;
  }

  const shortPrompt = byKind.short_text;
  check("short_text prompt available", Boolean(shortPrompt), shortPrompt?.id ?? null);

  if (shortPrompt) {
    const { data: row1000, error: e1000 } = await author.client
      .from("project_voice_responses")
      .upsert(
        {
          user_id: author.userId,
          project_id: shortPrompt.project_id,
          version_key: shortPrompt.version_key,
          prompt_id: shortPrompt.id,
          answer_value: "a".repeat(1000),
          answer_label: null,
          optional_comment: null,
          moderation_status: "visible",
        },
        { onConflict: "user_id,prompt_id" },
      )
      .select("id, answer_value")
      .maybeSingle();
    if (row1000?.id) created.responseIds.push(row1000.id);
    check(
      "short_text answer_value 1000 via authenticated upsert",
      !e1000 && row1000?.answer_value?.length === 1000,
      e1000?.message ?? row1000?.answer_value?.length,
    );

    const { error: e1001 } = await author.client.from("project_voice_responses").upsert(
      {
        user_id: author.userId,
        project_id: shortPrompt.project_id,
        version_key: shortPrompt.version_key,
        prompt_id: shortPrompt.id,
        answer_value: "a".repeat(1001),
        moderation_status: "visible",
      },
      { onConflict: "user_id,prompt_id" },
    );
    check(
      "answer_value 1001 rejected by DB CHECK",
      Boolean(e1001) &&
        (/check constraint|answer_value_len|violates check/i.test(e1001.message) ||
          e1001.code === "23514"),
      e1001?.message ?? "no error (072 not applied?)",
    );

    const { error: oc1001 } = await author.client.from("project_voice_responses").upsert(
      {
        user_id: author.userId,
        project_id: shortPrompt.project_id,
        version_key: shortPrompt.version_key,
        prompt_id: shortPrompt.id,
        answer_value: "ok",
        optional_comment: "c".repeat(1001),
        moderation_status: "visible",
      },
      { onConflict: "user_id,prompt_id" },
    );
    check("optional_comment 1001 still rejected (071)", Boolean(oc1001), oc1001?.message);

    const { data: oc1000, error: eOc1000 } = await author.client
      .from("project_voice_responses")
      .upsert(
        {
          user_id: author.userId,
          project_id: shortPrompt.project_id,
          version_key: shortPrompt.version_key,
          prompt_id: shortPrompt.id,
          answer_value: "ok",
          optional_comment: "y".repeat(1000),
          moderation_status: "visible",
        },
        { onConflict: "user_id,prompt_id" },
      )
      .select("id, optional_comment")
      .maybeSingle();
    if (oc1000?.id && !created.responseIds.includes(oc1000.id)) {
      created.responseIds.push(oc1000.id);
    }
    check(
      "optional_comment 1000 still accepted (071)",
      !eOc1000 && oc1000?.optional_comment?.length === 1000,
      eOc1000?.message ?? oc1000?.optional_comment?.length,
    );
  }

  for (const kind of ["choice", "yes_no", "scale_3"]) {
    const prompt = byKind[kind];
    if (!prompt) {
      check(`${kind} prompt available`, false, "skip");
      continue;
    }
    const sample =
      kind === "yes_no"
        ? "yes"
        : kind === "scale_3"
          ? "mid"
          : "option_a";
    const { data: row, error } = await author.client
      .from("project_voice_responses")
      .upsert(
        {
          user_id: author.userId,
          project_id: prompt.project_id,
          version_key: prompt.version_key,
          prompt_id: prompt.id,
          answer_value: sample,
          answer_label: sample,
          optional_comment: null,
          moderation_status: "visible",
        },
        { onConflict: "user_id,prompt_id" },
      )
      .select("id, answer_value")
      .maybeSingle();
    if (row?.id) created.responseIds.push(row.id);
    check(`${kind} answer_value still saves`, !error && row?.answer_value === sample, error?.message);
  }

  const rowCountAfter = await countAllRows();
  const lenAfter = await maxAnswerLen();
  const expectedDelta = created.responseIds.length;
  check(
    "row count delta matches ephemeral inserts only",
    rowCountAfter === rowCountBefore + expectedDelta,
    { before: rowCountBefore, after: rowCountAfter, delta: expectedDelta },
  );
  check("no existing rows truncated/over-1000 after probes", lenAfter.over1000 === 0, lenAfter);

  for (const id of created.responseIds) {
    await admin.from("project_voice_responses").delete().eq("id", id);
  }
  for (const uid of created.userIds) {
    await admin.auth.admin.deleteUser(uid);
  }

  const rowCountFinal = await countAllRows();
  check(
    "row count restored to baseline after cleanup",
    rowCountFinal === rowCountBefore,
    { before: rowCountBefore, final: rowCountFinal },
  );

  const failed = results.filter((r) => !r.pass);
  console.log(
    JSON.stringify(
      {
        ref,
        migration: "072_registered_voice_answer_value_max_1000.sql",
        rowCountBefore,
        rowCountFinal,
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
