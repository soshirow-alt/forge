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
 *
 * Hero selection does not remove items from shelf arrays — shelves keep
 * RPC order and may duplicate hero IDs.
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
