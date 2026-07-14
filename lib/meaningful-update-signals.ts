/**
 * Canonical “meaningful update” signals — mirrors home discovery RPC:
 * non-initial project_devlogs + released release events (not onboarding),
 * only after first_published_at.
 */

export type MeaningfulUpdateSignal = {
  projectId: string;
  at: string;
  kind: "devlog" | "version";
};

export type MeaningfulUpdateByProject = {
  at: string;
  kinds: Set<"devlog" | "version">;
  hasVersionEvent: boolean;
};

function toMs(iso: string | null | undefined): number | null {
  if (!iso) {
    return null;
  }
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function resolveMeaningfulUpdateByProject(input: {
  signals: MeaningfulUpdateSignal[];
  firstPublishedAtByProject: Map<string, string | null>;
}): Map<string, MeaningfulUpdateByProject> {
  const byProject = new Map<string, MeaningfulUpdateByProject>();

  for (const signal of input.signals) {
    const firstPublishedAt = input.firstPublishedAtByProject.get(signal.projectId) ?? null;
    const firstMs = toMs(firstPublishedAt);
    const atMs = toMs(signal.at);
    if (atMs == null) {
      continue;
    }
    if (firstMs != null && atMs <= firstMs) {
      continue;
    }

    const existing = byProject.get(signal.projectId);
    if (!existing) {
      byProject.set(signal.projectId, {
        at: signal.at,
        kinds: new Set([signal.kind]),
        hasVersionEvent: signal.kind === "version",
      });
      continue;
    }

    existing.kinds.add(signal.kind);
    if (signal.kind === "version") {
      existing.hasVersionEvent = true;
    }
    if (atMs > (toMs(existing.at) ?? 0)) {
      existing.at = signal.at;
    }
  }

  return byProject;
}

/** True only when both timestamps are known and meaningful update is strictly after last play. */
export function isUpdatedSinceLastPlay(input: {
  meaningfulUpdateAt: string | null | undefined;
  lastPlayedAt: string | null | undefined;
}): boolean {
  const updateMs = toMs(input.meaningfulUpdateAt);
  const playMs = toMs(input.lastPlayedAt);
  if (updateMs == null || playMs == null) {
    return false;
  }
  return updateMs > playMs;
}
