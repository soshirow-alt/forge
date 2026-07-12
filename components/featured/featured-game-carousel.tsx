"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FeaturedGameCard } from "@/components/featured/featured-game-card";
import type { FeaturedExtraSlot } from "@/components/featured/featured-game-card";
import { GeneratedThumbnailPoster } from "@/components/generated-thumbnail-poster";
import type { HomeDiscoveryCard } from "@/lib/supabase/home-discovery-db";

export type FeaturedThumbnailsState =
  | { status: "loading" }
  | { status: "ready"; byId: Record<string, string[]> }
  | { status: "error" };

/** Desktop card width — v0 FeaturedGameCard */
const CARD_WIDTH_PX = 1000;
/** gap-3 = 12px between center card and side peeks */
const CARD_GAP_PX = 12;
const AUTOPLAY_MS = 5000;

function resolveGalleryUrls(
  slide: HomeDiscoveryCard,
  thumbnails: FeaturedThumbnailsState,
): string[] {
  if (thumbnails.status === "ready") {
    const fromDb = thumbnails.byId[slide.id];
    if (fromDb && fromDb.length > 0) {
      return fromDb;
    }
  }
  return slide.image ? [slide.image] : [];
}

function slideGallery(
  slide: HomeDiscoveryCard,
  thumbnails: FeaturedThumbnailsState,
): { cover: string; screenshots: string[]; extraSlots: FeaturedExtraSlot[] } {
  const urls = resolveGalleryUrls(slide, thumbnails);
  const cover = urls[0] ?? "";
  const screenshots = urls.slice(1, 3);
  const extraSlots: FeaturedExtraSlot[] =
    thumbnails.status === "loading"
      ? ["loading", "loading"]
      : [screenshots[0] ?? null, screenshots[1] ?? null];
  return { cover, screenshots, extraSlots };
}

function NeighborPeek({
  side,
  game,
  coverSrc,
  widthPx,
  onSelect,
  onMouseUp,
}: {
  side: "left" | "right";
  game: HomeDiscoveryCard;
  coverSrc: string;
  widthPx: number;
  onSelect: () => void;
  onMouseUp: (event: MouseEvent<HTMLElement>) => void;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (widthPx <= 0) return null;

  return (
    <button
      type="button"
      aria-label={`${game.title} を表示`}
      onClick={onSelect}
      onMouseUp={onMouseUp}
      className={`absolute top-0 z-10 hidden h-full overflow-hidden rounded-xl opacity-[0.38] brightness-[0.82] transition-[opacity,filter] duration-200 hover:opacity-50 hover:brightness-95 md:block ${
        side === "left" ? "left-0" : "right-0"
      }`}
      style={{ width: widthPx }}
    >
      <span className="relative block h-full w-full bg-black">
        {coverSrc && failedSrc !== coverSrc ? (
          <Image
            key={coverSrc}
            src={coverSrc}
            alt=""
            fill
            aria-hidden
            className={
              side === "left"
                ? "object-cover object-right"
                : "object-cover object-left"
            }
            sizes={`${Math.ceil(widthPx)}px`}
            loading="lazy"
            onError={() => setFailedSrc(coverSrc)}
          />
        ) : (
          <GeneratedThumbnailPoster
            projectId={game.id}
            title={game.title}
            genre={game.genre ?? ""}
            phase={game.version ?? ""}
          />
        )}
      </span>
    </button>
  );
}

export function FeaturedGameCarousel({
  slides,
  thumbnails,
}: {
  slides: HomeDiscoveryCard[];
  thumbnails: FeaturedThumbnailsState;
}) {
  const games = slides;
  const count = games.length;
  const circular = count >= 3;

  const [gameIndex, setGameIndex] = useState(0);
  const [selectedScreenshot, setSelectedScreenshot] = useState<number | null>(
    null,
  );
  const [viewportWidth, setViewportWidth] = useState(CARD_WIDTH_PX);
  const [hovering, setHovering] = useState(false);
  const [keyboardFocusWithin, setKeyboardFocusWithin] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const autoplayTimerRef = useRef<number | null>(null);
  const goNextRef = useRef<() => void>(() => undefined);

  const safeIndex = count > 0 ? ((gameIndex % count) + count) % count : 0;

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

  const goToGame = useCallback(
    (index: number) => {
      if (count === 0) return;
      const next = ((index % count) + count) % count;
      setSelectedScreenshot(null);
      setGameIndex(next);
    },
    [count],
  );

  const goNext = useCallback(() => {
    if (count === 0) return;
    setSelectedScreenshot(null);
    setGameIndex((current) => (current + 1) % count);
  }, [count]);

  const goPrev = useCallback(() => {
    if (count === 0) return;
    setSelectedScreenshot(null);
    setGameIndex((current) => (current - 1 + count) % count);
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

  // Single setTimeout — cleared and rescheduled whenever pause conditions or slide change.
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
    gameIndex,
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

  /** Mouse activation should not leave a sticky pause via residual focus. */
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

  const activeGame = games[safeIndex]!;
  const activeGallery = slideGallery(activeGame, thumbnails);
  const activeMainSrc =
    selectedScreenshot === null
      ? activeGallery.cover
      : (activeGallery.screenshots[selectedScreenshot] ?? activeGallery.cover);

  const prevIndex = (safeIndex - 1 + count) % count;
  const nextIndex = (safeIndex + 1) % count;
  const prevGame = games[prevIndex]!;
  const nextGame = games[nextIndex]!;
  const prevCover = slideGallery(prevGame, thumbnails).cover;
  const nextCover = slideGallery(nextGame, thumbnails).cover;

  const peekWidthPx = circular
    ? Math.max(0, (viewportWidth - CARD_WIDTH_PX) / 2 - CARD_GAP_PX)
    : 0;

  return (
    <section
      ref={sectionRef}
      aria-label="注目＆おすすめ"
      className="w-full"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={syncKeyboardFocusWithin}
      onBlurCapture={() => {
        window.requestAnimationFrame(syncKeyboardFocusWithin);
      }}
    >
      <h1 className="mb-4 text-xl font-bold text-white">注目＆おすすめ</h1>

      <div
        ref={viewportRef}
        className={`relative w-full overflow-hidden md:h-[350px] ${
          circular ? "" : "mx-auto md:max-w-[1000px]"
        }`}
      >
        {circular ? (
          <>
            <NeighborPeek
              side="left"
              game={prevGame}
              coverSrc={prevCover}
              widthPx={peekWidthPx}
              onSelect={() => goToGame(prevIndex)}
              onMouseUp={blurMouseTarget}
            />
            <NeighborPeek
              side="right"
              game={nextGame}
              coverSrc={nextCover}
              widthPx={peekWidthPx}
              onSelect={() => goToGame(nextIndex)}
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
          <FeaturedGameCard
            game={activeGame}
            mainSrc={activeMainSrc}
            extraSlots={activeGallery.extraSlots}
            selectedScreenshot={selectedScreenshot}
            onSelectScreenshot={setSelectedScreenshot}
          />
        </div>

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              onMouseUp={blurMouseTarget}
              aria-label="前の作品"
              className="absolute left-2 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              onMouseUp={blurMouseTarget}
              aria-label="次の作品"
              className="absolute right-2 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        {games.map((g, i) => (
          <button
            key={`${g.id}-dot-${g.heroSource ?? "hero"}`}
            type="button"
            onClick={() => goToGame(i)}
            onMouseUp={blurMouseTarget}
            aria-label={`${g.title} を表示`}
            aria-current={i === safeIndex}
            className={`h-2 rounded-full transition-all ${
              i === safeIndex
                ? "w-6 bg-violet-500"
                : "w-2 bg-white/25 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
