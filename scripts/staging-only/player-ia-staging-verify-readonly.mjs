#!/usr/bin/env node
/**
 * STAGING read-only verification after 076–081 + seed.
 * Uses anon key only. Aborts on Production ref.
 *
 *   node scripts/staging-only/player-ia-staging-verify-readonly.mjs
 */
import { createClient } from "@supabase/supabase-js";

const STAGING = "vuqpwvjvgyxffmvpfrxo";
const PROD = "bpnisgzxuwdxelhnduuf";
const TAG = "forge-ia-seed-v1";
const ZERO = "zzz-ia-seed-nohit-999";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const ref = (() => {
  try {
    return new URL(url).hostname.split(".")[0];
  } catch {
    return null;
  }
})();

if (!url || !anon) {
  console.error("ABORT: missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY");
  process.exit(1);
}
if (ref === PROD) {
  console.error("ABORT: Production ref");
  process.exit(1);
}
if (ref !== STAGING) {
  console.error(`ABORT: expected ${STAGING}, got ${ref}`);
  process.exit(1);
}

const sb = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function rpc(name, args = {}) {
  const { data, error } = await sb.rpc(name, args);
  return { data, error: error ? { message: error.message, code: error.code } : null };
}

async function main() {
  const out = { ref, schema: {}, seed: {}, rpc: {}, search: {}, privacy: {}, ok: true, notes: [] };

  // Schema via selecting columns (anon-visible public projects)
  {
    const { data, error } = await sb
      .from("projects")
      .select(
        "id,category,quick_try,usable_for_creation,looking_for_testers,stream_policy,stream_policy_note,asset_kinds,purpose_tags,category_attributes,visibility,tags,title,owner_id",
      )
      .contains("tags", [TAG])
      .limit(50);
    out.schema.projectsSelect = error ? { error: error.message } : { ok: true, rows: data?.length ?? 0 };
    if (error) out.ok = false;

    const rows = data || [];
    out.seed.projects_total = rows.length;
    const byCat = {};
    const stream = { ok: 0, conditional: 0, no: 0, unset: 0 };
    let qt = 0, lft = 0, ufc = 0;
    const assetKinds = {};
    for (const r of rows) {
      byCat[r.category || "?"] = (byCat[r.category || "?"] || 0) + 1;
      const sp = r.stream_policy || "unset";
      stream[sp] = (stream[sp] || 0) + 1;
      if (r.quick_try) qt += 1;
      if (r.looking_for_testers) lft += 1;
      if (r.usable_for_creation) ufc += 1;
      for (const k of r.asset_kinds || []) assetKinds[k] = (assetKinds[k] || 0) + 1;
    }
    out.seed.byCategory = byCat;
    out.seed.stream = stream;
    out.seed.quick_try = qt;
    out.seed.looking_for_testers = lft;
    out.seed.usable_for_creation = ufc;
    out.seed.assetKinds = assetKinds;
    out.seed.dedicatedOwners = [
      ...new Set(
        rows
          .filter((r) => String(r.owner_id || "").startsWith("a1a1a1a1-a1a1-41a1-81a1-"))
          .map((r) => r.owner_id),
      ),
    ].length;
    out.seed.sampleIds = rows.slice(0, 3).map((r) => r.id);
  }

  // Profiles
  {
    const { data, error } = await sb
      .from("developer_profiles")
      .select("user_id,creator_id,public_name,activity_tags,profile")
      .like("creator_id", "ia-seed-dev-%");
    out.seed.auth_profiles = error ? { error: error.message } : (data || []).length;
    if (!error && data) {
      out.seed.activityTagSamples = data.slice(0, 5).map((d) => ({
        creator_id: d.creator_id,
        activity_tags: d.activity_tags,
      }));
      out.seed.streamerCreators = data.filter((d) =>
        (d.activity_tags || []).includes("streamer_creator"),
      ).length;
      // multi-category owners via owned seed projects
      const owners = data.map((d) => d.user_id);
      const { data: owned } = await sb
        .from("projects")
        .select("owner_id,category")
        .contains("tags", [TAG])
        .in("owner_id", owners);
      const catsByOwner = {};
      for (const p of owned || []) {
        if (!catsByOwner[p.owner_id]) catsByOwner[p.owner_id] = new Set();
        catsByOwner[p.owner_id].add(p.category);
      }
      const multi = Object.entries(catsByOwner)
        .filter(([, s]) => s.size >= 2)
        .map(([id, s]) => ({ owner_id: id, categories: [...s] }));
      out.seed.profilesOwningSeedProjects = Object.keys(catsByOwner).length;
      out.seed.multiCategoryCreators = multi;
      out.seed.profileLeakEmail = data.some(
        (d) => /@/.test(JSON.stringify(d)) && /gmail|yahoo|outlook/i.test(JSON.stringify(d)),
      );
    }
  }

  // Usage via RPC
  {
    const { data, error } = await rpc("get_public_project_usage_relations", {
      p_project_id: null,
      p_limit: 50,
    });
    out.rpc.usage = {
      error,
      count: data?.length ?? 0,
      pairs: (data || []).map((r) => ({
        source: r.source_category,
        target: r.target_category,
        type: r.relation_type,
        source_id: r.source_project_id,
        target_id: r.target_project_id,
      })),
    };
    if (error) out.ok = false;
    const self = (data || []).filter((r) => r.source_project_id === r.target_project_id);
    out.rpc.usageSelfRefs = self.length;
    const types = new Set((data || []).map((r) => r.relation_type));
    out.rpc.usageTypes = [...types];
  }

  // Announcements
  {
    const { data, error } = await rpc("get_public_platform_announcements", {
      p_limit: 50,
      p_offset: 0,
    });
    out.rpc.announcements = {
      error,
      count: data?.length ?? 0,
      titles: (data || []).map((a) => a.title),
      draftLeak: (data || []).some((a) => /下書き|draft/i.test(a.title || "")),
    };
    if (error) out.ok = false;
  }

  // Home RPCs
  for (const [name, args] of [
    ["get_home_newest_projects", { p_limit: 20, p_category: null }],
    ["get_home_review_highlights", { p_limit: 10 }],
    ["get_home_meaningful_updates", { p_limit: 10 }],
  ]) {
    const { data, error } = await rpc(name, args);
    out.rpc[name] = {
      error,
      count: data?.length ?? 0,
      categories: [...new Set((data || []).map((r) => r.category || r.project_category))],
      sample: (data || []).slice(0, 2),
    };
    if (error) out.ok = false;
  }

  // Category shelf
  out.rpc.byCategory = {};
  for (const cat of ["game", "audio", "asset", "dev-tool", "service-app"]) {
    const { data, error } = await rpc("get_public_projects_by_category", {
      p_category: cat,
      p_sort: "newest",
      p_quick_try: null,
      p_feedback_wanted: null,
      p_usable_for_creation: null,
      p_stream_policy: null,
      p_asset_kind: null,
      p_limit: 50,
      p_offset: 0,
    });
    const seedish = (data || []).filter((r) => (r.title || "").includes("[IA Seed]"));
    out.rpc.byCategory[cat] = {
      error,
      total: data?.length ?? 0,
      seedTitles: seedish.length,
    };
    if (error) out.ok = false;
  }

  // Search terms
  const terms = [
    "ローグライク",
    "ホラー好き",
    "Unity",
    "Unreal Engine",
    "Godot",
    "配信者",
    "ドット絵",
    "3Dキャラクター",
    "BGM制作",
    "短編ゲーム",
    "制作に使える",
    "配信OK",
    ZERO,
    "unity",
    "ローグ ライク",
  ];
  out.search = {};
  for (const q of terms) {
    const { data, error } = await rpc("search_public_catalog", { p_query: q, p_limit: 20 });
    const kinds = {};
    for (const r of data || []) kinds[r.result_kind] = (kinds[r.result_kind] || 0) + 1;
    const emails = (data || []).filter((r) => /@/.test(`${r.title || ""}${r.subtitle || ""}`));
    out.search[q] = {
      error,
      count: data?.length ?? 0,
      kinds,
      titles: (data || []).slice(0, 5).map((r) => `${r.result_kind}:${r.title}`),
      emailLeak: emails.length > 0,
    };
    if (error) out.ok = false;
  }

  // Private project leak via newest / search
  {
    const { data } = await sb
      .from("projects")
      .select("id,visibility,title")
      .eq("visibility", "private")
      .limit(5);
    out.privacy.privateVisibleToAnonSelect = (data || []).length;
    // Anon RLS should hide private — if we get rows, leak
  }

  // Feedback counts (public readable?)
  for (const [label, table, filter] of [
    ["feedback_registered", "project_feedback", { column: "id", op: "like", val: "99999999-9999-4999-8999-%" }],
    ["feedback_guest", "project_guest_feedback", { column: "id", op: "like", val: "bbbbbbbb-bbbb-4bbb-8bbb-%" }],
  ]) {
    let q = sb.from(table).select("id", { count: "exact", head: true });
    if (filter.op === "like") q = q.like(filter.column, filter.val);
    const { count, error } = await q;
    out.seed[label] = error ? { error: error.message } : count;
  }

  // empathies / replies / devlogs / releases may be denied to anon
  for (const [label, table, pattern] of [
    ["empathies", "feedback_card_empathies", "88888888-8888-4888-8888-%"],
    ["replies", "feedback_card_replies", "77777777-7777-4777-8777-%"],
    ["devlogs", "project_devlogs", "66666666-6666-4666-8666-%"],
    ["release_events", "project_release_events", "55555555-5555-4555-8555-%"],
  ]) {
    const { count, error } = await sb
      .from(table)
      .select("id", { count: "exact", head: true })
      .like("id", pattern);
    out.seed[label] = error ? { error: error.message, note: "anon may lack SELECT" } : count;
  }

  // Expectations
  const expect = {
    projects_total: 40,
    auth_profiles: 20,
    profilesOwningSeedProjects: 20,
  };
  out.expect = expect;
  out.pass = {
    projects40: out.seed.projects_total === 40,
    eachCat8: Object.values(out.seed.byCategory || {}).every((n) => n === 8) &&
      Object.keys(out.seed.byCategory || {}).length === 5,
    profiles20: out.seed.auth_profiles === 20,
    owners20: out.seed.profilesOwningSeedProjects === 20,
    zeroHit: out.search[ZERO]?.count === 0,
    noDraftAnn: out.rpc.announcements?.draftLeak === false,
    usageNoSelf: out.rpc.usageSelfRefs === 0,
    usageTypeUsed: (out.rpc.usageTypes || []).every((t) => t === "used"),
    homeNewestNonEmpty: (out.rpc.get_home_newest_projects?.count || 0) > 0,
    noSearchEmail: Object.values(out.search).every((s) => !s.emailLeak),
  };
  out.ok = out.ok && Object.values(out.pass).every(Boolean);

  // Serialize Sets
  console.log(JSON.stringify(out, null, 2));
  process.exit(out.ok ? 0 : 2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
