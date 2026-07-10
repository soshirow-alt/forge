import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectReleaseStatus } from "@/lib/project-release-state";

export type ProjectSpecialThanksWatcher = {
  displayName: string;
  handle: string | null;
  avatarUrl: string | null;
  watchedAt: string;
};

export type ProjectSpecialThanksWitness = {
  displayName: string;
  handle: string | null;
  avatarUrl: string | null;
  grantedAt: string;
};

export type ProjectSpecialThanksUpdateContributor = {
  displayName: string;
  handle: string | null;
  avatarUrl: string | null;
  adoptedFeedbackCount: number;
  latestPublishedVersion: string | null;
  latestUpdateSummary: string | null;
  latestAdoptedAt: string;
};

export type ProjectSpecialThanksEarlyPlayer = {
  displayName: string;
  handle: string | null;
  avatarUrl: string | null;
  firstContributedAt: string;
  firstVersionKey: string | null;
};

export type ProjectSpecialThanks = {
  projectId: string | null;
  releaseStatus: ProjectReleaseStatus | null;
  watchers: ProjectSpecialThanksWatcher[];
  witnesses: ProjectSpecialThanksWitness[];
  updateContributors: ProjectSpecialThanksUpdateContributor[];
  earlyPlayers: ProjectSpecialThanksEarlyPlayer[];
};

export const EMPTY_PROJECT_SPECIAL_THANKS: ProjectSpecialThanks = {
  projectId: null,
  releaseStatus: null,
  watchers: [],
  witnesses: [],
  updateContributors: [],
  earlyPlayers: [],
};

type RpcRow = {
  project_id?: unknown;
  release_status?: unknown;
  watchers?: unknown;
  witnesses?: unknown;
  update_contributors?: unknown;
  early_players?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asIso(value: unknown): string | null {
  const s = asString(value);
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

function asCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 0) return Math.floor(n);
  }
  return 0;
}

function parsePersonBase(row: unknown): {
  displayName: string;
  handle: string | null;
  avatarUrl: string | null;
} | null {
  const r = asRecord(row);
  if (!r) return null;
  const displayName = asString(r.display_name);
  if (!displayName) return null;
  return {
    displayName,
    handle: asString(r.handle),
    avatarUrl: asString(r.avatar_url),
  };
}

function parseWatchers(value: unknown): ProjectSpecialThanksWatcher[] {
  if (!Array.isArray(value)) return [];
  const out: ProjectSpecialThanksWatcher[] = [];
  for (const row of value) {
    const base = parsePersonBase(row);
    const r = asRecord(row);
    const watchedAt = r ? asIso(r.watched_at) : null;
    if (!base || !watchedAt) continue;
    out.push({ ...base, watchedAt });
  }
  return out;
}

function parseWitnesses(value: unknown): ProjectSpecialThanksWitness[] {
  if (!Array.isArray(value)) return [];
  const out: ProjectSpecialThanksWitness[] = [];
  for (const row of value) {
    const base = parsePersonBase(row);
    const r = asRecord(row);
    const grantedAt = r ? asIso(r.granted_at) : null;
    if (!base || !grantedAt) continue;
    out.push({ ...base, grantedAt });
  }
  return out;
}

function parseUpdateContributors(value: unknown): ProjectSpecialThanksUpdateContributor[] {
  if (!Array.isArray(value)) return [];
  const out: ProjectSpecialThanksUpdateContributor[] = [];
  for (const row of value) {
    const base = parsePersonBase(row);
    const r = asRecord(row);
    const latestAdoptedAt = r ? asIso(r.latest_adopted_at) : null;
    if (!base || !r || !latestAdoptedAt) continue;
    out.push({
      ...base,
      adoptedFeedbackCount: Math.max(1, asCount(r.adopted_feedback_count)),
      latestPublishedVersion: asString(r.latest_published_version),
      latestUpdateSummary: asString(r.latest_update_summary),
      latestAdoptedAt,
    });
  }
  return out;
}

function parseEarlyPlayers(value: unknown): ProjectSpecialThanksEarlyPlayer[] {
  if (!Array.isArray(value)) return [];
  const out: ProjectSpecialThanksEarlyPlayer[] = [];
  for (const row of value) {
    const base = parsePersonBase(row);
    const r = asRecord(row);
    const firstContributedAt = r ? asIso(r.first_contributed_at) : null;
    if (!base || !firstContributedAt) continue;
    out.push({
      ...base,
      firstContributedAt,
      firstVersionKey: r ? asString(r.first_version_key) : null,
    });
  }
  return out;
}

function parseReleaseStatus(value: unknown): ProjectReleaseStatus | null {
  const s = asString(value);
  if (s === "in_development" || s === "released" || s === "release_reopened") {
    return s;
  }
  return null;
}

function parsePayload(raw: unknown): ProjectSpecialThanks {
  const row = asRecord(raw);
  if (!row) return EMPTY_PROJECT_SPECIAL_THANKS;
  return {
    projectId: asString(row.project_id),
    releaseStatus: parseReleaseStatus(row.release_status),
    watchers: parseWatchers(row.watchers),
    witnesses: parseWitnesses(row.witnesses),
    updateContributors: parseUpdateContributors(row.update_contributors),
    earlyPlayers: parseEarlyPlayers(row.early_players),
  };
}

export async function fetchProjectSpecialThanks(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectSpecialThanks> {
  const id = projectId.trim();
  if (!id) return EMPTY_PROJECT_SPECIAL_THANKS;

  const { data, error } = await supabase.rpc("get_project_special_thanks", {
    p_project_id: id,
  });

  if (error) {
    console.error("[project-special-thanks] rpc failed", error.message);
    throw error;
  }

  const row = Array.isArray(data) ? (data[0] as RpcRow | undefined) : (data as RpcRow | null);
  return parsePayload(row);
}
