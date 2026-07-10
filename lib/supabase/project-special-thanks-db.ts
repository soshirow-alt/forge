import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { ProjectReleaseStatus } from "@/lib/project-release-state";

export type ProjectSpecialThanksWitness = {
  displayName: string;
  handle: string | null;
  grantedAt: string;
};

export type ProjectSpecialThanksAdoption = {
  displayName: string;
  handle: string | null;
  playerQuote: string;
  updateSummary: string;
  publishedVersion: string;
};

export type ProjectSpecialThanksEarlyPlayer = {
  displayName: string;
  handle: string | null;
  firstContributedAt: string;
};

export type ProjectSpecialThanks = {
  projectId: string | null;
  releaseStatus: ProjectReleaseStatus | null;
  watchCount: number;
  witnesses: ProjectSpecialThanksWitness[];
  adoptions: ProjectSpecialThanksAdoption[];
  earlyPlayers: ProjectSpecialThanksEarlyPlayer[];
};

export const EMPTY_PROJECT_SPECIAL_THANKS: ProjectSpecialThanks = {
  projectId: null,
  releaseStatus: null,
  watchCount: 0,
  witnesses: [],
  adoptions: [],
  earlyPlayers: [],
};

type RpcPayload = {
  project_id?: string | null;
  release_status?: string | null;
  watch_count?: number | string | null;
  witnesses?: unknown;
  adoptions?: unknown;
  early_players?: unknown;
};

function toCount(value: number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function readString(row: Record<string, unknown>, key: string): string | null {
  const value = row[key];
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseReleaseStatus(value: string | null | undefined): ProjectReleaseStatus | null {
  if (
    value === "in_development" ||
    value === "released" ||
    value === "release_reopened"
  ) {
    return value;
  }
  return null;
}

function parseWitnesses(value: unknown): ProjectSpecialThanksWitness[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: ProjectSpecialThanksWitness[] = [];
  for (const item of value) {
    const row = asRecord(item);
    if (!row) {
      continue;
    }
    const displayName = readString(row, "display_name");
    const grantedAt = readString(row, "granted_at");
    if (!displayName || !grantedAt) {
      continue;
    }
    out.push({
      displayName,
      handle: readString(row, "handle"),
      grantedAt,
    });
  }
  return out;
}

function parseAdoptions(value: unknown): ProjectSpecialThanksAdoption[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: ProjectSpecialThanksAdoption[] = [];
  for (const item of value) {
    const row = asRecord(item);
    if (!row) {
      continue;
    }
    const displayName = readString(row, "display_name");
    const playerQuote = readString(row, "player_quote");
    const updateSummary = readString(row, "update_summary");
    const publishedVersion = readString(row, "published_version");
    if (!displayName || !playerQuote || !updateSummary || !publishedVersion) {
      continue;
    }
    out.push({
      displayName,
      handle: readString(row, "handle"),
      playerQuote,
      updateSummary,
      publishedVersion,
    });
  }
  return out;
}

function parseEarlyPlayers(value: unknown): ProjectSpecialThanksEarlyPlayer[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: ProjectSpecialThanksEarlyPlayer[] = [];
  for (const item of value) {
    const row = asRecord(item);
    if (!row) {
      continue;
    }
    const displayName = readString(row, "display_name");
    const firstContributedAt = readString(row, "first_contributed_at");
    if (!displayName || !firstContributedAt) {
      continue;
    }
    out.push({
      displayName,
      handle: readString(row, "handle"),
      firstContributedAt,
    });
  }
  return out;
}

function payloadToSpecialThanks(payload: RpcPayload): ProjectSpecialThanks {
  return {
    projectId:
      typeof payload.project_id === "string" && payload.project_id.trim()
        ? payload.project_id
        : null,
    releaseStatus: parseReleaseStatus(payload.release_status),
    watchCount: toCount(payload.watch_count),
    witnesses: parseWitnesses(payload.witnesses),
    adoptions: parseAdoptions(payload.adoptions),
    earlyPlayers: parseEarlyPlayers(payload.early_players),
  };
}

export function isProjectSpecialThanksRpcMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const row = error as PostgrestError;
  const message = row.message ?? "";
  return (
    row.code === "PGRST202" ||
    row.code === "42883" ||
    message.includes("get_project_special_thanks") ||
    message.includes("Could not find the function")
  );
}

export async function fetchProjectSpecialThanks(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectSpecialThanks> {
  const { data, error } = await supabase.rpc("get_project_special_thanks", {
    p_project_id: projectId,
  });

  if (error) {
    if (isProjectSpecialThanksRpcMissingError(error)) {
      return { ...EMPTY_PROJECT_SPECIAL_THANKS };
    }
    throw error;
  }

  if (!data || typeof data !== "object") {
    return { ...EMPTY_PROJECT_SPECIAL_THANKS };
  }

  return payloadToSpecialThanks(data as RpcPayload);
}
