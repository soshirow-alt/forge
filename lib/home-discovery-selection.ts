export type HomeDiscoverySection = "newest" | "updated" | "trending";

export type HeroSource = HomeDiscoverySection;

export type HomeDiscoveryCandidate = {
  id: string;
  section: HomeDiscoverySection;
  rank: number;
};

export type HeroItem<T extends HomeDiscoveryCandidate> = T & {
  heroSource: HeroSource;
};

/**
 * Pick up to 3 hero items by mixing trending → updated → newest firsts,
 * then filling from next ranks when ties/empties occur.
 */
export function selectHeroItems<T extends HomeDiscoveryCandidate>(
  trending: T[],
  updated: T[],
  newest: T[],
  maxHero = 3,
): HeroItem<T>[] {
  const lists: { source: HeroSource; items: T[] }[] = [
    { source: "trending", items: trending },
    { source: "updated", items: updated },
    { source: "newest", items: newest },
  ];

  const selected: HeroItem<T>[] = [];
  const selectedIds = new Set<string>();

  for (const { source, items } of lists) {
    const head = items[0];
    if (!head) continue;
    if (selectedIds.has(head.id)) continue;
    selected.push({ ...head, heroSource: source });
    selectedIds.add(head.id);
    if (selected.length >= maxHero) {
      return selected;
    }
  }

  const cursors = [1, 1, 1];
  while (selected.length < maxHero) {
    let progressed = false;
    for (let i = 0; i < lists.length; i += 1) {
      const { source, items } = lists[i]!;
      while (cursors[i]! < items.length) {
        const candidate = items[cursors[i]!]!;
        cursors[i]! += 1;
        if (selectedIds.has(candidate.id)) continue;
        selected.push({ ...candidate, heroSource: source });
        selectedIds.add(candidate.id);
        progressed = true;
        break;
      }
      if (selected.length >= maxHero) {
        return selected;
      }
    }
    if (!progressed) break;
  }

  return selected;
}

/**
 * Rebuild section carousel with soft hero exclusion on the first page only.
 * Used for updated / trending shelves. Newest keeps RPC order and does not
 * call this helper (no hero exclusion).
 *
 * - First page is non-hero items only (up to 4).
 * - If fewer than 4 non-hero items exist, return only those (do not pad with heroes).
 * - If zero non-hero items, return [] (caller hides the section).
 * - Heroes may reappear only after a full non-hero first page of 4.
 */
export function buildSectionCarouselItems<T extends { id: string }>(
  candidates: T[],
  heroIds: ReadonlySet<string>,
  firstPageSize = 4,
): T[] {
  const nonHeroItems = candidates.filter((item) => !heroIds.has(item.id));
  const firstPageItems = nonHeroItems.slice(0, firstPageSize);

  if (firstPageItems.length < firstPageSize) {
    return firstPageItems;
  }

  const firstPageIds = new Set(firstPageItems.map((item) => item.id));
  const remainingItems = candidates.filter((item) => !firstPageIds.has(item.id));

  return [...firstPageItems, ...remainingItems];
}
