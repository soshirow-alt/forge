"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  planCategoryHomeHero,
  resolveCategoryHomeHeroActiveIndex,
  resolveCategoryHomeHeroRail,
  type CategoryHomeHeroSlot,
} from "@/lib/player-ia/category-home-hero";
import {
  HOME_HERO_GRID_CLASS,
  HOME_HERO_MIN_HEIGHT_CLASS,
  HOME_HERO_QUEUE_GAP_PX,
  HOME_HERO_ROTATE_MS,
  resolveHomeHeroQueueRowHeight,
} from "@/lib/player-ia/home-hero-geometry";

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
  const [hovering, setHovering] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [railHeight, setRailHeight] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const rootId = `${headingId}-root`;
  const safeActive = resolveCategoryHomeHeroActiveIndex(
    plan.reals.length,
    activeIndex,
  );

  const promote = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const measure = () => setRailHeight(el.clientHeight || null);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [safeActive, plan.reals.length]);

  const canRotate = plan.canRotate && !reducedMotion;

  useEffect(() => {
    clearTimer();
    if (!canRotate || hovering || focusWithin) return;
    timerRef.current = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % plan.reals.length);
    }, HOME_HERO_ROTATE_MS);
    return clearTimer;
  }, [
    canRotate,
    hovering,
    focusWithin,
    safeActive,
    plan.reals.length,
    clearTimer,
  ]);

  const rail = resolveCategoryHomeHeroRail(plan.reals, safeActive);
  if (!rail) return null;

  const queueRowHeight = resolveHomeHeroQueueRowHeight(railHeight);
  const rowStyle: CSSProperties =
    queueRowHeight != null
      ? { height: queueRowHeight, flex: "0 0 auto" }
      : { flex: "1 1 0" };

  return (
    <section
      aria-labelledby={headingId}
      id={rootId}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={() => {
        window.requestAnimationFrame(() => {
          const active = document.activeElement;
          const section = document.getElementById(rootId);
          if (
            !section ||
            !(active instanceof Element) ||
            !section.contains(active)
          ) {
            setFocusWithin(false);
          }
        });
      }}
    >
      <div className="mb-4 flex items-end justify-between gap-4">
        {title}
        {seeAll}
      </div>
      <div className={HOME_HERO_GRID_CLASS}>
        <div
          ref={heroRef}
          className={
            reducedMotion
              ? HOME_HERO_MIN_HEIGHT_CLASS
              : `${HOME_HERO_MIN_HEIGHT_CLASS} transition-opacity duration-500`
          }
        >
          {renderHero(rail.hero)}
        </div>
        <div
          className="flex w-full min-h-0 flex-col"
          style={{
            height: railHeight ?? undefined,
            gap: HOME_HERO_QUEUE_GAP_PX,
          }}
        >
          {rail.right.map((slot, index) => (
            <HeroRailSlot
              key={slot.kind === "real" ? `real-${index}` : `ph-${index}`}
              slot={slot}
              reals={plan.reals}
              onPromote={promote}
              placeholder={placeholder}
              renderRail={renderRail}
              style={rowStyle}
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
  style,
}: {
  slot: CategoryHomeHeroSlot<T>;
  reals: T[];
  onPromote: (index: number) => void;
  placeholder: ReactNode;
  renderRail: (item: T, onPromote: () => void) => ReactNode;
  style: CSSProperties;
}) {
  if (slot.kind === "placeholder") {
    return (
      <div className="flex w-full min-h-0" style={style}>
        {placeholder}
      </div>
    );
  }
  const realIndex = reals.indexOf(slot.item);
  return (
    <div className="flex w-full min-h-0" style={style}>
      {renderRail(slot.item, () => {
        if (realIndex >= 0) onPromote(realIndex);
      })}
    </div>
  );
}
