/**
 * STAGING ONLY — compute home discovery ranking from tables (mirrors 052/053 logic).
 * Used when RPC is broken/unavailable. Guard: staging ref only. Read-only.
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import {
  buildSectionCarouselItems,
  selectHeroItems,
} from "../../lib/home-discovery-selection.ts";
import {
  formatHomeDiscoveryTimeLabel,
  timeKindForSection,
} from "../../lib/home-discovery-time-label.ts";

const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";
const PROD_REF = "bpnisgzxuwdxelhnduuf";
const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function loadEnv(path = ".env.local") {
  const env = { ...process.env };
  if (!existsSync(path)) return env;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[trimmed.slice(0, eq).trim()] = value;
  }
  return env;
}

function extractRef(url) {
  try {
    const m = new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

const env = loadEnv();
const ref = extractRef(env.NEXT_PUBLIC_SUPABASE_URL || "");
if (ref !== STAGING_REF || ref === PROD_REF) {
  console.error("Abort: not staging", ref);
  process.exit(1);
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const now = Date.now();
const windowStart = new Date(now - WINDOW_MS).toISOString();

const { data: projects } = await sb
  .from("projects")
  .select(
    "id, title, description, playable_version, thumbnail_url, genre, visibility, first_published_at, created_at",
  )
  .eq("visibility", "public")
  .not("first_published_at", "is", null);

const publicProjects = projects ?? [];
const ids = publicProjects.map((p) => p.id);

const { data: devlogs } = await sb
  .from("project_devlogs")
  .select("project_id, created_at, is_initial_publish, title, published_version")
  .in("project_id", ids.length ? ids : ["__none__"]);

const { data: releases } = await sb
  .from("project_release_events")
  .select("project_id, created_at, event_type, source")
  .eq("event_type", "released")
  .in("project_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

const { data: voices } = await sb
  .from("project_voice_responses")
  .select("project_id, user_id, created_at, moderation_status")
  .gte("created_at", windowStart)
  .eq("moderation_status", "visible");

const { data: feedback } = await sb
  .from("project_feedback")
  .select("project_id, user_id, created_at, moderation_status")
  .gte("created_at", windowStart)
  .eq("moderation_status", "visible");

const { data: watches } = await sb
  .from("project_watches")
  .select("project_id, user_id, created_at")
  .gte("created_at", windowStart);

const { data: sessions } = await sb
  .from("project_play_sessions")
  .select("project_id, user_id, played_at")
  .gte("played_at", windowStart);

const { data: statsRows, error: statsErr } = await sb.rpc(
  "get_public_project_stats",
  { p_project_ids: ids },
);

const statsById = Object.fromEntries(
  (statsRows ?? []).map((s) => [s.project_id, s]),
);

function meaningfulAt(projectId, firstPublishedAt) {
  const times = [];
  for (const d of devlogs ?? []) {
    if (d.project_id !== projectId) continue;
    if (d.is_initial_publish === true) continue;
    if (Date.parse(d.created_at) > Date.parse(firstPublishedAt)) {
      times.push(d.created_at);
    }
  }
  for (const e of releases ?? []) {
    if (e.project_id !== projectId) continue;
    if (e.source === "onboarding") continue;
    if (Date.parse(e.created_at) > Date.parse(firstPublishedAt)) {
      times.push(e.created_at);
    }
  }
  if (times.length === 0) return null;
  return times.sort().at(-1);
}

function engagement(projectId) {
  const fbUsers = new Set();
  let last = null;
  const bump = (iso) => {
    if (!last || Date.parse(iso) > Date.parse(last)) last = iso;
  };
  for (const r of [...(voices ?? []), ...(feedback ?? [])]) {
    if (r.project_id !== projectId || !r.user_id) continue;
    fbUsers.add(r.user_id);
    bump(r.created_at);
  }
  let watchers = 0;
  for (const w of watches ?? []) {
    if (w.project_id !== projectId) continue;
    watchers += 1;
    bump(w.created_at);
  }
  const players = new Set();
  for (const s of sessions ?? []) {
    if (s.project_id !== projectId) continue;
    players.add(s.user_id);
    bump(s.played_at);
  }
  return {
    feedback_users_7d: fbUsers.size,
    watchers_7d: watchers,
    players_7d: players.size,
    last_engagement_at: last,
  };
}

const newest = [...publicProjects]
  .sort(
    (a, b) =>
      Date.parse(b.first_published_at) - Date.parse(a.first_published_at) ||
      a.id.localeCompare(b.id),
  )
  .map((p, i) => ({
    id: p.id,
    section: "newest",
    rank: i + 1,
    title: p.title,
    card_time_at: p.first_published_at,
    reason: `first_published_at=${p.first_published_at}`,
    label: formatHomeDiscoveryTimeLabel(p.first_published_at, "published"),
  }));

const updated = publicProjects
  .map((p) => ({
    p,
    meaningful_update_at: meaningfulAt(p.id, p.first_published_at),
  }))
  .filter((x) => x.meaningful_update_at)
  .sort(
    (a, b) =>
      Date.parse(b.meaningful_update_at) - Date.parse(a.meaningful_update_at) ||
      a.p.id.localeCompare(b.p.id),
  )
  .map((x, i) => ({
    id: x.p.id,
    section: "updated",
    rank: i + 1,
    title: x.p.title,
    card_time_at: x.meaningful_update_at,
    reason: `meaningful_update_at=${x.meaningful_update_at} (non-initial devlog/studio release after first_published_at)`,
    label: formatHomeDiscoveryTimeLabel(x.meaningful_update_at, "updated"),
  }));

const trending = publicProjects
  .map((p) => ({ p, ...engagement(p.id) }))
  .filter(
    (x) =>
      x.feedback_users_7d + x.watchers_7d > 0,
  )
  .sort((a, b) => {
    if (b.feedback_users_7d !== a.feedback_users_7d) {
      return b.feedback_users_7d - a.feedback_users_7d;
    }
    if (b.watchers_7d !== a.watchers_7d) return b.watchers_7d - a.watchers_7d;
    if (b.players_7d !== a.players_7d) return b.players_7d - a.players_7d;
    const la = a.last_engagement_at ? Date.parse(a.last_engagement_at) : 0;
    const lb = b.last_engagement_at ? Date.parse(b.last_engagement_at) : 0;
    if (lb !== la) return lb - la;
    const fa = Date.parse(a.p.first_published_at);
    const fb = Date.parse(b.p.first_published_at);
    if (fb !== fa) return fb - fa;
    return a.p.id.localeCompare(b.p.id);
  })
  .map((x, i) => ({
    id: x.p.id,
    section: "trending",
    rank: i + 1,
    title: x.p.title,
    card_time_at: x.last_engagement_at,
    feedback_users_7d: x.feedback_users_7d,
    watchers_7d: x.watchers_7d,
    players_7d: x.players_7d,
    reason: `fb=${x.feedback_users_7d} watchers=${x.watchers_7d} players=${x.players_7d} last=${x.last_engagement_at}`,
    label: formatHomeDiscoveryTimeLabel(x.last_engagement_at, "engaged"),
  }));

const hero = selectHeroItems(trending, updated, newest);
const heroIds = new Set(hero.map((h) => h.id));
const carousels = {
  updated: buildSectionCarouselItems(updated, heroIds, 4),
  trending: buildSectionCarouselItems(trending, heroIds, 4),
  newest: buildSectionCarouselItems(newest, heroIds, 4),
};

console.log(
  JSON.stringify(
    {
      ref,
      windowStart,
      statsError: statsErr?.message ?? null,
      sectionCounts: {
        newest: newest.length,
        updated: updated.length,
        trending: trending.length,
      },
      newest,
      updated,
      trending,
      hero: hero.map((h) => ({
        id: h.id,
        title: h.title,
        heroSource: h.heroSource,
        label: h.label,
        rankInSource: h.rank,
      })),
      firstPageExcludesHero: {
        updated: carousels.updated.slice(0, 4).map((c) => c.id),
        trending: carousels.trending.slice(0, 4).map((c) => c.id),
        newest: carousels.newest.slice(0, 4).map((c) => c.id),
      },
      heroCanReappearAfterPage1: {
        updated: carousels.updated.slice(4).some((c) => heroIds.has(c.id)),
        trending: carousels.trending.slice(4).some((c) => heroIds.has(c.id)),
        newest: carousels.newest.slice(4).some((c) => heroIds.has(c.id)),
        note: "With only 1–2 public projects, page2 may be empty; reappearance needs 5+ candidates in that section.",
      },
      emptySectionsHidden: {
        newest: newest.length === 0,
        updated: updated.length === 0,
        trending: trending.length === 0,
      },
      noCrossFill: true,
    },
    null,
    2,
  ),
);
