"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  planCategoryHomeHero,
  resolveCategoryHomeHeroActiveIndex,
  resolveCategoryHomeHeroRail,
  type CategoryHomeHeroSlot,
} from "@/lib/player-ia/category-home-hero";

const AUTOPLAY_MS = 8000;

export function CategoryHomeHero<T>({
  items,
  headingId,
  title,
  seeAll,
  placeholder,
  renderHero,
  renderRail,
}: {
  items: T[];
  headingId: string;
  title: ReactNode;
  seeAll?: ReactNode;
  placeholder: ReactNode;
  renderHero: (item: T) => ReactNode;
  renderRail: (item: T, onPromote: () => void) => ReactNode;
}) {
  const plan = planCategoryHomeHero(items);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const safeActive = resolveCategoryHomeHeroActiveIndex(
    plan.reals.length,
    activeIndex,
  );

  const promote = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    if (!plan.canRotate || paused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % plan.reals.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [plan.canRotate, plan.reals.length, paused]);

  const rail = resolveCategoryHomeHeroRail(plan.reals, safeActive);
  if (!rail) return null;

  return (
    <section
      aria-labelledby={headingId}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mb-4 flex items-end justify-between gap-4">
        {title}
        {seeAll}
      </div>
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        <div className="min-h-0 lg:h-full">{renderHero(rail.hero)}</div>
        <div className="flex min-h-0 flex-col gap-3">
          {rail.right.map((slot, index) => (
            <HeroRailSlot
              key={slot.kind === "real" ? `real-${index}` : `ph-${index}`}
              slot={slot}
              reals={plan.reals}
              onPromote={promote}
              placeholder={placeholder}
              renderRail={renderRail}
            />
          ))}
        </div>
      </div>
      {plan.showDots ? (
        <div className="mt-3 flex justify-center gap-1.5">
          {plan.reals.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`作品 ${index + 1}`}
              onClick={() => promote(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === safeActive
                  ? "w-6 bg-violet-400"
                  : "w-1.5 bg-zinc-600 hover:bg-zinc-500"
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function HeroRailSlot<T>({
  slot,
  reals,
  onPromote,
  placeholder,
  renderRail,
}: {
  slot: CategoryHomeHeroSlot<T>;
  reals: T[];
  onPromote: (index: number) => void;
  placeholder: ReactNode;
  renderRail: (item: T, onPromote: () => void) => ReactNode;
}) {
  if (slot.kind === "placeholder") {
    return <div className="flex min-h-[148px] flex-1">{placeholder}</div>;
  }
  const realIndex = reals.indexOf(slot.item);
  return (
    <div className="flex min-h-[148px] flex-1">
      {renderRail(slot.item, () => {
        if (realIndex >= 0) onPromote(realIndex);
      })}
    </div>
  );
}
