import type { ProjectCategoryId } from "@/lib/project-categories";
import { HOME_HERO_RAIL_SLOTS } from "@/lib/player-ia/home-hero-geometry";

export const CATEGORY_HOME_HERO_REAL_LIMIT = 4;
export const CATEGORY_HOME_HERO_RAIL_SLOTS = HOME_HERO_RAIL_SLOTS;

export const CATEGORY_HOME_HERO_PLACEHOLDER_COPY =
  "このカテゴリの次の作品を待っています";

export const WHOLE_HOME_HERO_PLACEHOLDER_COPY =
  "次の作品を待っています";

export type CategoryHomeHeroWork = {
  projectId: string;
  title: string;
  description: string;
  category: ProjectCategoryId;
  genre?: string | null;
  creator?: string | null;
  publishedAt?: string | null;
};

export type CategoryHomeHeroSlot<T> =
  | { kind: "real"; item: T }
  | { kind: "placeholder" };

export type CategoryHomeHeroPlan<T> = {
  reals: T[];
  canRotate: boolean;
  showDots: boolean;
  placeholderCount: number;
};

export function takeCategoryHomeHeroReals<T>(items: T[]): T[] {
  return items.slice(0, CATEGORY_HOME_HERO_REAL_LIMIT);
}

export function planCategoryHomeHero<T>(items: T[]): CategoryHomeHeroPlan<T> {
  const reals = takeCategoryHomeHeroReals(items);
  const canRotate = reals.length >= 2;
  return {
    reals,
    canRotate,
    showDots: canRotate,
    placeholderCount: Math.max(0, CATEGORY_HOME_HERO_RAIL_SLOTS - Math.max(0, reals.length - 1)),
  };
}

export function resolveCategoryHomeHeroActiveIndex(
  realCount: number,
  requested: number,
): number {
  if (realCount <= 0) return 0;
  const normalized = Number.isFinite(requested) ? Math.trunc(requested) : 0;
  return ((normalized % realCount) + realCount) % realCount;
}

export function resolveCategoryHomeHeroRail<T>(
  reals: T[],
  activeIndex: number,
): { hero: T; right: CategoryHomeHeroSlot<T>[] } | null {
  if (reals.length === 0) return null;
  const safe = resolveCategoryHomeHeroActiveIndex(reals.length, activeIndex);
  const hero = reals[safe];
  if (!hero) return null;
  const others = reals.filter((_, index) => index !== safe);
  const right: CategoryHomeHeroSlot<T>[] = others.map((item) => ({
    kind: "real",
    item,
  }));
  while (right.length < CATEGORY_HOME_HERO_RAIL_SLOTS) {
    right.push({ kind: "placeholder" });
  }
  return { hero, right: right.slice(0, CATEGORY_HOME_HERO_RAIL_SLOTS) };
}

export function fillCategoryHomeHeroWorks(
  ranked: CategoryHomeHeroWork[],
  extras: CategoryHomeHeroWork[],
  limit = CATEGORY_HOME_HERO_REAL_LIMIT,
): CategoryHomeHeroWork[] {
  const out = takeCategoryHomeHeroReals(ranked).slice(0, limit);
  const seen = new Set(out.map((item) => item.projectId));
  for (const extra of extras) {
    if (out.length >= limit) break;
    if (!extra.projectId || seen.has(extra.projectId)) continue;
    seen.add(extra.projectId);
    out.push(extra);
  }
  return out;
}

export function isCategoryHomeHeroPlaceholderSlot<T>(
  slot: CategoryHomeHeroSlot<T>,
): slot is { kind: "placeholder" } {
  return slot.kind === "placeholder";
}
