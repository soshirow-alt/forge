"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ExplorePrototypeFeaturedCard } from "@/components/explore-prototype/explore-prototype-featured-card";
import { ExplorePrototypeThumb } from "@/components/explore-prototype/explore-prototype-thumb";
import type { ExplorePrototypeWork } from "@/lib/prototype/explore-prototype";
import { resolveExplorePrototypeThumbnail } from "@/lib/prototype/explore-prototype";

/** Match Production FeaturedGameCarousel geometry. */
const CARD_WIDTH_PX = 1000;
const CARD_GAP_PX = 12;
const AUTOPLAY_MS = 5000;

function ExplorePrototypeNeighborPeek({
  side,
  work,
  widthPx,
  onSelect,
  onMouseUp,
}: {
  side: "left" | "right";
  work: ExplorePrototypeWork;
  widthPx: number;
  onSelect: () => void;
  onMouseUp: (event: MouseEvent<HTMLElement>) => void;
}) {
  if (widthPx <= 0) return null;
  const thumb = resolveExplorePrototypeThumbnail(work);

  return (
    <button
      type="button"
      aria-label={`${work.title} を表示`}
      onClick={onSelect}
      onMouseUp={onMouseUp}
      className={`absolute top-0 z-10 hidden h-full overflow-hidden rounded-xl opacity-[0.38] brightness-[0.82] transition-[opacity,filter] duration-200 hover:opacity-50 hover:brightness-95 md:block ${
        side === "left" ? "left-0" : "right-0"
      }`}
      style={{ width: widthPx }}
    >
      <span className="relative block h-full w-full bg-black">
        <ExplorePrototypeThumb
          src={thumb.src}
          alt=""
          fit="cover"
          objectPosition={
            side === "left" ? "object-right" : "object-left"
          }
          frameClassName="h-full w-full rounded-none bg-black"
        />
      </span>
    </button>
  );
}

/**
 * Explore Prototype featured hero — Production FeaturedGameCarousel behavior,
 * fixture-backed (no Production component mutation).
 */
export function ExplorePrototypeFeaturedCarousel({
  slides,
  heading = "注目の作品",
  headingLevel = "h2",
}: {
  slides: ExplorePrototypeWork[];
  heading?: string;
  headingLevel?: "h1" | "h2";
}) {
  const works = slides;
  const count = works.length;
  const circular = count >= 3;

  const [workIndex, setWorkIndex] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(CARD_WIDTH_PX);
  const [hovering, setHovering] = useState(false);
  const [keyboardFocusWithin, setKeyboardFocusWithin] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const autoplayTimerRef = useRef<number | null>(null);
  const goNextRef = useRef<() => void>(() => undefined);

  const safeIndex = count > 0 ? ((workIndex % count) + count) % count : 0;

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => {
      setViewportWidth(el.clientWidth || CARD_WIDTH_PX);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [count, circular]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const sync = () => setTabHidden(document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const clearAutoplay = useCallback(() => {
    if (autoplayTimerRef.current != null) {
      window.clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
  }, []);

  const goToWork = useCallback(
    (index: number) => {
      if (count === 0) return;
      setWorkIndex(((index % count) + count) % count);
    },
    [count],
  );

  const goNext = useCallback(() => {
    if (count === 0) return;
    setWorkIndex((current) => (current + 1) % count);
  }, [count]);

  const goPrev = useCallback(() => {
    if (count === 0) return;
    setWorkIndex((current) => (current - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    goNextRef.current = goNext;
  }, [goNext]);

  const autoplayPaused =
    !circular ||
    hovering ||
    keyboardFocusWithin ||
    tabHidden ||
    reducedMotion ||
    count < 3;

  useEffect(() => {
    clearAutoplay();
    if (autoplayPaused) return;

    autoplayTimerRef.current = window.setTimeout(() => {
      autoplayTimerRef.current = null;
      goNextRef.current();
    }, AUTOPLAY_MS);

    return clearAutoplay;
  }, [
    autoplayPaused,
    clearAutoplay,
    workIndex,
    hovering,
    keyboardFocusWithin,
    tabHidden,
    reducedMotion,
    circular,
    count,
  ]);

  const syncKeyboardFocusWithin = useCallback(() => {
    const section = sectionRef.current;
    if (!section) {
      setKeyboardFocusWithin(false);
      return;
    }
    const active = document.activeElement;
    if (!(active instanceof Element) || !section.contains(active)) {
      setKeyboardFocusWithin(false);
      return;
    }
    setKeyboardFocusWithin(active.matches(":focus-visible"));
  }, []);

  const blurMouseTarget = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const target = event.currentTarget;
      window.requestAnimationFrame(() => {
        if (
          document.activeElement === target &&
          target instanceof HTMLElement &&
          !target.matches(":focus-visible")
        ) {
          target.blur();
        }
        syncKeyboardFocusWithin();
      });
    },
    [syncKeyboardFocusWithin],
  );

  if (count === 0) {
    return null;
  }

  const activeWork = works[safeIndex]!;
  const prevIndex = (safeIndex - 1 + count) % count;
  const nextIndex = (safeIndex + 1) % count;
  const prevWork = works[prevIndex]!;
  const nextWork = works[nextIndex]!;

  const peekWidthPx = circular
    ? Math.max(0, (viewportWidth - CARD_WIDTH_PX) / 2 - CARD_GAP_PX)
    : 0;

  const HeadingTag = headingLevel;

  return (
    <section
      ref={sectionRef}
      aria-label={heading}
      className="w-full"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={syncKeyboardFocusWithin}
      onBlurCapture={() => {
        window.requestAnimationFrame(syncKeyboardFocusWithin);
      }}
    >
      <HeadingTag className="mb-4 text-xl font-bold text-white">
        {heading}
      </HeadingTag>

      <div
        ref={viewportRef}
        className={`relative w-full overflow-hidden md:h-[350px] ${
          circular ? "" : "mx-auto md:max-w-[1000px]"
        }`}
      >
        {circular ? (
          <>
            <ExplorePrototypeNeighborPeek
              side="left"
              work={prevWork}
              widthPx={peekWidthPx}
              onSelect={() => goToWork(prevIndex)}
              onMouseUp={blurMouseTarget}
            />
            <ExplorePrototypeNeighborPeek
              side="right"
              work={nextWork}
              widthPx={peekWidthPx}
              onSelect={() => goToWork(nextIndex)}
              onMouseUp={blurMouseTarget}
            />
          </>
        ) : null}

        <div
          className={`relative z-[15] h-full w-full max-w-[1000px] ${
            circular
              ? "mx-auto md:absolute md:left-1/2 md:top-0 md:w-[1000px] md:-translate-x-1/2"
              : "mx-auto"
          }`}
        >
          <ExplorePrototypeFeaturedCard work={activeWork} />
        </div>

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              onMouseUp={blurMouseTarget}
              aria-label="前の作品"
              className="absolute left-2 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={goNext}
              onMouseUp={blurMouseTarget}
              aria-label="次の作品"
              className="absolute right-2 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-2">
          {works.map((work, i) => (
            <button
              key={`${work.id}-dot`}
              type="button"
              onClick={() => goToWork(i)}
              onMouseUp={blurMouseTarget}
              aria-label={`${work.title} を表示`}
              aria-current={i === safeIndex ? "true" : undefined}
              className={`h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                i === safeIndex
                  ? "w-6 bg-violet-500"
                  : "w-2 bg-white/25 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
