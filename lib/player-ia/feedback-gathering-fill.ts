import type { HomeFeedbackGatheringProject } from "@/lib/supabase/player-ia-home-db";
import { CATEGORY_HOME_HERO_REAL_LIMIT } from "@/lib/player-ia/category-home-hero";

/** Outside-window / below-threshold fill — not a 30d/90d ranked window. */
export const FEEDBACK_GATHERING_FILL_WINDOW_DAYS = 0;

export type FeedbackFillCardInput = {
  cardId: string;
  createdAt: string;
  authorKind: string;
  /** Stable author key when the caller has one (user id / guest submitter). Never a display name. */
  authorKey?: string | null;
};

export function resolveFillAuthorCount(input: {
  participantCount: number;
  guestSubmitterKeys: string[];
}): number {
  const guests = new Set(
    input.guestSubmitterKeys.map((key) => key.trim()).filter(Boolean),
  );
  return Math.max(0, input.participantCount) + guests.size;
}

export function extraFromPublicFeedbackCards(
  project: {
    projectId: string;
    title: string;
    category: HomeFeedbackGatheringProject["category"];
    description: string;
    thumbnail: string;
    fallbackLastAt: string;
  },
  cards: FeedbackFillCardInput[],
  participantCount: number,
  guestSubmitterKeys: string[] = [],
): HomeFeedbackGatheringProject | null {
  if (cards.length < 1) return null;
  const stableKeys = cards
    .map((card) => card.authorKey?.trim())
    .filter((key): key is string => Boolean(key));
  const distinctAuthorCount =
    stableKeys.length > 0
      ? new Set(stableKeys).size
      : resolveFillAuthorCount({ participantCount, guestSubmitterKeys });
  const lastFeedbackAt =
    cards
      .map((card) => card.createdAt)
      .filter(Boolean)
      .sort((a, b) => (Date.parse(b) || 0) - (Date.parse(a) || 0))[0] ??
    project.fallbackLastAt;
  return {
    projectId: project.projectId,
    title: project.title,
    category: project.category,
    description: project.description,
    thumbnail: project.thumbnail,
    windowDays: FEEDBACK_GATHERING_FILL_WINDOW_DAYS,
    distinctAuthorCount,
    feedbackCount: cards.length,
    hasCreatorReply: false,
    lastFeedbackAt,
  };
}

export function compareFeedbackGatheringFill(
  a: HomeFeedbackGatheringProject,
  b: HomeFeedbackGatheringProject,
): number {
  if (b.feedbackCount !== a.feedbackCount) {
    return b.feedbackCount - a.feedbackCount;
  }
  if (b.distinctAuthorCount !== a.distinctAuthorCount) {
    return b.distinctAuthorCount - a.distinctAuthorCount;
  }
  const aAt = Date.parse(a.lastFeedbackAt) || 0;
  const bAt = Date.parse(b.lastFeedbackAt) || 0;
  if (bAt !== aAt) return bAt - aAt;
  return a.projectId.localeCompare(b.projectId);
}

/**
 * Keep existing 30d/90d ranking first. Append public works with ≥1 feedback
 * that are not already selected, in deterministic ranking-adjacent order.
 * Never invents placeholder / 「FB募集中」 rows.
 */
export function mergeFeedbackGatheringFill(
  ranked: HomeFeedbackGatheringProject[],
  extras: HomeFeedbackGatheringProject[],
  limit = CATEGORY_HOME_HERO_REAL_LIMIT,
): HomeFeedbackGatheringProject[] {
  const out = ranked.slice();
  const seen = new Set(out.map((item) => item.projectId));
  const sorted = extras
    .filter((item) => item.feedbackCount >= 1 && !seen.has(item.projectId))
    .slice()
    .sort(compareFeedbackGatheringFill);
  for (const item of sorted) {
    if (out.length >= limit) break;
    if (seen.has(item.projectId)) continue;
    seen.add(item.projectId);
    out.push(item);
  }
  return out.slice(0, limit);
}
