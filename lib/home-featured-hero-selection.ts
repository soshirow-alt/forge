/**
 * Deterministic featured-hero soft owner diversity (mirrors 066/067 SQL).
 * Used by local unit verify only — runtime hero selection is get_home_featured_hero RPC.
 */
import type { FeaturedHeroType } from "@/lib/home-featured-hero";
import { FEATURED_HERO_TYPE_ORDER } from "@/lib/home-featured-hero";

export type FeaturedHeroCandidate = {
  id: string;
  featuredType: FeaturedHeroType;
  axisRank: number;
  ownerId?: string | null;
};

export function pickFeaturedHeroSlots<T extends FeaturedHeroCandidate>(
  byType: Record<FeaturedHeroType, T[]>,
): T[] {
  const selected: T[] = [];
  const selectedIds = new Set<string>();
  const selectedOwners = new Set<string>();

  for (const type of FEATURED_HERO_TYPE_ORDER) {
    const candidates = [...(byType[type] ?? [])].sort(
      (a, b) => a.axisRank - b.axisRank,
    );
    const available = candidates.filter((c) => !selectedIds.has(c.id));
    if (available.length === 0) continue;

    available.sort((a, b) => {
      const aDup =
        a.ownerId && selectedOwners.has(a.ownerId) ? 1 : 0;
      const bDup =
        b.ownerId && selectedOwners.has(b.ownerId) ? 1 : 0;
      if (aDup !== bDup) return aDup - bDup;
      return a.axisRank - b.axisRank;
    });

    const pick = available[0]!;
    selected.push(pick);
    selectedIds.add(pick.id);
    if (pick.ownerId) selectedOwners.add(pick.ownerId);
  }

  return selected;
}
