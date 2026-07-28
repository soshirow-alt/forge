import type { ProjectCategoryId } from "@/lib/project-categories";

export type ShelfProjectRef = {
  projectId: string;
  category: ProjectCategoryId;
};

/**
 * Soft category suppression within a ranked candidate list.
 * Keeps shelf-native order; prefers not to repeat a category while alternatives remain.
 * Never invents weaker items outside the candidate pool.
 */
export function softSuppressByCategory<T extends ShelfProjectRef>(
  ranked: T[],
  limit: number,
): T[] {
  if (limit <= 0 || ranked.length === 0) return [];
  if (ranked.length <= limit) return ranked.slice();

  const selected: T[] = [];
  const deferred: T[] = [];
  const categoryCounts = new Map<string, number>();

  for (const item of ranked) {
    if (selected.length >= limit) break;
    const count = categoryCounts.get(item.category) ?? 0;
    const remainingSlots = limit - selected.length;
    const remainingCandidates =
      ranked.length - (selected.length + deferred.length) - 1;
    // Defer a category repeat when we still have room and other candidates may diversify.
    if (count >= 1 && remainingSlots > 0 && remainingCandidates > 0) {
      deferred.push(item);
      continue;
    }
    selected.push(item);
    categoryCounts.set(item.category, count + 1);
  }

  for (const item of deferred) {
    if (selected.length >= limit) break;
    selected.push(item);
    categoryCounts.set(
      item.category,
      (categoryCounts.get(item.category) ?? 0) + 1,
    );
  }

  if (selected.length < limit) {
    const selectedIds = new Set(selected.map((s) => s.projectId));
    for (const item of ranked) {
      if (selected.length >= limit) break;
      if (selectedIds.has(item.projectId)) continue;
      selected.push(item);
      selectedIds.add(item.projectId);
    }
  }

  return selected;
}

/**
 * Newest shelf: keep chronological order unless all selected slots share one category,
 * then lightly swap later same-category slots with the next different-category candidate.
 */
export function softAdjustNewestChronology<T extends ShelfProjectRef>(
  ranked: T[],
  limit: number,
): T[] {
  if (limit <= 0 || ranked.length === 0) return [];
  const head = ranked.slice(0, Math.min(limit, ranked.length));
  if (head.length < limit) return head;

  const allSame = head.every((item) => item.category === head[0].category);
  if (!allSame) return head;

  const selected = head.slice();
  const used = new Set(selected.map((s) => s.projectId));
  for (let i = selected.length - 1; i >= 1; i -= 1) {
    const replacement = ranked.find(
      (c) => !used.has(c.projectId) && c.category !== head[0].category,
    );
    if (!replacement) break;
    used.delete(selected[i].projectId);
    selected[i] = replacement;
    used.add(replacement.projectId);
    if (!selected.every((item) => item.category === selected[0].category)) {
      break;
    }
  }
  return selected;
}

export type UsagePairRef = {
  id: string;
  sourceProjectId: string;
  sourceCategory: ProjectCategoryId;
  targetProjectId: string;
  targetCategory: ProjectCategoryId;
};

const PREFERRED_PAIR_KEYS = [
  "game>audio",
  "game>asset",
  "game>dev-tool",
  "service-app>dev-tool",
] as const;

function pairKey(source: ProjectCategoryId, target: ProjectCategoryId): string {
  return `${source}>${target}`;
}

/**
 * Select usage pairs: used-only already filtered by RPC.
 * Soft: max 2 per identical category-pair key; prefer preferred mix patterns.
 */
export function selectUsagePairs<T extends UsagePairRef>(
  ranked: T[],
  limit: number,
): T[] {
  if (limit <= 0 || ranked.length === 0) return [];

  const pairCounts = new Map<string, number>();
  const selected: T[] = [];
  const seenPairIds = new Set<string>();

  const tryTake = (item: T): boolean => {
    if (selected.length >= limit) return false;
    if (seenPairIds.has(item.id)) return false;
    if (item.sourceProjectId === item.targetProjectId) return false;
    const key = pairKey(item.sourceCategory, item.targetCategory);
    const count = pairCounts.get(key) ?? 0;
    if (count >= 2) return false;
    selected.push(item);
    seenPairIds.add(item.id);
    pairCounts.set(key, count + 1);
    return true;
  };

  // Pass 1: preferred category mixes
  for (const preferred of PREFERRED_PAIR_KEYS) {
    for (const item of ranked) {
      if (selected.length >= limit) break;
      if (pairKey(item.sourceCategory, item.targetCategory) !== preferred) {
        continue;
      }
      tryTake(item);
    }
  }

  // Pass 2: fill remaining in native order with soft pair-key cap
  for (const item of ranked) {
    if (selected.length >= limit) break;
    tryTake(item);
  }

  return selected;
}

/**
 * Soft cross-shelf project suppression.
 * Connections (usage) may reappear; other shelves prefer unique projects.
 * Never drops below available unique fill when candidates run out.
 */
export function softSuppressCrossShelfProject<T extends { projectId: string }>(
  ranked: T[],
  limit: number,
  alreadyShown: ReadonlySet<string>,
  options?: { allowShown?: boolean },
): T[] {
  if (limit <= 0 || ranked.length === 0) return [];
  const allowShown = options?.allowShown === true;
  if (allowShown) {
    return ranked.slice(0, limit);
  }

  const preferred: T[] = [];
  const fallback: T[] = [];
  for (const item of ranked) {
    if (alreadyShown.has(item.projectId)) {
      fallback.push(item);
    } else {
      preferred.push(item);
    }
  }

  const out = preferred.slice(0, limit);
  if (out.length < limit) {
    for (const item of fallback) {
      if (out.length >= limit) break;
      out.push(item);
    }
  }
  return out;
}

export function collectProjectIds(
  items: Array<{ projectId: string }>,
): Set<string> {
  return new Set(items.map((item) => item.projectId));
}

export function collectUsageProjectIds(
  items: Array<{ sourceProjectId: string; targetProjectId: string }>,
): Set<string> {
  const ids = new Set<string>();
  for (const item of items) {
    ids.add(item.sourceProjectId);
    ids.add(item.targetProjectId);
  }
  return ids;
}
