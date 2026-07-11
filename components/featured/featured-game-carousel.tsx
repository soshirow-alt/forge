"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type TransitionEvent,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FeaturedGameCard } from "@/components/featured/featured-game-card";
import type { FeaturedExtraSlot } from "@/components/featured/featured-game-card";
import type { HomeDiscoveryCard } from "@/lib/supabase/home-discovery-db";

export type FeaturedThumbnailsState =
  | { status: "loading" }
  | { status: "ready"; byId: Record<string, string[]> }
  | { status: "error" };

/** Desktop card width — v0 FeaturedGameCard */
const CARD_WIDTH_PX = 1000;
/** gap-3 = 12px between full cards on the track */
const CARD_GAP_PX = 12;
const AUTOPLAY_MS = 5000;

type TrackSlide = {
  game: HomeDiscoveryCard;
  /** Real index in `games`, or -1 for clones */
  realIndex: number;
  clone: "leading" | "trailing" | null;
  key: string;
};

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

function buildTrack(games: HomeDiscoveryCard[], circular: boolean): TrackSlide[] {
  if (games.length === 0) return [];
  if (!circular) {
    return games.map((game, realIndex) => ({
      game,
      realIndex,
      clone: null,
      key: `real-${game.id}-${game.heroSource ?? "hero"}`,
    }));
  }
  const first = games[0]!;
  const last = games[games.length - 1]!;
  return [
    {
      game: last,
      realIndex: games.length - 1,
      clone: "leading",
      key: `clone-leading-${last.id}`,
    },
    ...games.map((game, realIndex) => ({
      game,
      realIndex,
      clone: null,
      key: `real-${game.id}-${game.heroSource ?? "hero"}`,
    })),
    {
      game: first,
      realIndex: 0,
      clone: "trailing",
      key: `clone-trailing-${first.id}`,
    },
  ];
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
  /** Index on the rendered track (includes leading clone offset when circular). */
  const [trackPos, setTrackPos] = useState(() => (count >= 3 ? 1 : 0));
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [selectedScreenshot, setSelectedScreenshot] = useState<number | null>(
    null,
  );
  const [viewportWidth, setViewportWidth] = useState(CARD_WIDTH_PX);
  const [hovering, setHovering] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [autoplayNonce, setAutoplayNonce] = useState(0);

  const viewportRef = useRef<HTMLDivElement>(null);
  const gameIndexRef = useRef(gameIndex);
  const pendingJumpRef = useRef<number | null>(null);

  useEffect(() => {
    gameIndexRef.current = gameIndex;
  }, [gameIndex]);

  const safeIndex = count > 0 ? ((gameIndex % count) + count) % count : 0;
  const track = useMemo(
    () => buildTrack(games, circular),
    [games, circular],
  );

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

  // Keep trackPos aligned when circular mode / slide set changes.
  useEffect(() => {
    if (count === 0) return;
    const nextSafe = ((gameIndexRef.current % count) + count) % count;
    setGameIndex(nextSafe);
    setTrackPos(circular ? nextSafe + 1 : nextSafe);
    setTransitionEnabled(false);
    const id = window.requestAnimationFrame(() => {
      setTransitionEnabled(true);
    });
    return () => window.cancelAnimationFrame(id);
  }, [count, circular]);

  const translateX = useMemo(() => {
    const step = CARD_WIDTH_PX + CARD_GAP_PX;
    const cardCenter = trackPos * step + CARD_WIDTH_PX / 2;
    return viewportWidth / 2 - cardCenter;
  }, [trackPos, viewportWidth]);

  const bumpAutoplay = useCallback(() => {
    setAutoplayNonce((n) => n + 1);
  }, []);

  const goToGame = useCallback(
    (index: number, opts?: { direction?: "next" | "prev" | "direct" }) => {
      if (count === 0) return;
      const next = ((index % count) + count) % count;
      const direction = opts?.direction ?? "direct";
      setSelectedScreenshot(null);
      bumpAutoplay();

      if (!circular) {
        setTransitionEnabled(true);
        setGameIndex(next);
        setTrackPos(next);
        return;
      }

      const current = gameIndexRef.current;

      if (direction === "next" && current === count - 1 && next === 0) {
        pendingJumpRef.current = 1;
        setTransitionEnabled(true);
        setTrackPos(count + 1);
        setGameIndex(0);
        return;
      }

      if (direction === "prev" && current === 0 && next === count - 1) {
        pendingJumpRef.current = count;
        setTransitionEnabled(true);
        setTrackPos(0);
        setGameIndex(count - 1);
        return;
      }

      pendingJumpRef.current = null;
      setTransitionEnabled(true);
      setGameIndex(next);
      setTrackPos(next + 1);
    },
    [bumpAutoplay, circular, count],
  );

  const goNext = useCallback(() => {
    if (count === 0) return;
    const current = gameIndexRef.current;
    goToGame((current + 1) % count, { direction: "next" });
  }, [count, goToGame]);

  const goPrev = useCallback(() => {
    if (count === 0) return;
    const current = gameIndexRef.current;
    goToGame((current - 1 + count) % count, { direction: "prev" });
  }, [count, goToGame]);

  const handleTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLDivElement>) => {
      if (event.propertyName !== "transform") return;
      const jumpTo = pendingJumpRef.current;
      if (jumpTo == null) return;
      pendingJumpRef.current = null;
      setTransitionEnabled(false);
      setTrackPos(jumpTo);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setTransitionEnabled(true);
        });
      });
    },
    [],
  );

  const autoplayPaused =
    !circular ||
    hovering ||
    focusWithin ||
    tabHidden ||
    reducedMotion ||
    count < 3;

  useEffect(() => {
    if (autoplayPaused) return;
    const id = window.setInterval(() => {
      goNext();
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [autoplayPaused, autoplayNonce, goNext]);

  if (count === 0) {
    return null;
  }

  const activeGame = games[safeIndex]!;
  const activeGallery = slideGallery(activeGame, thumbnails);
  const activeMainSrc =
    selectedScreenshot === null
      ? activeGallery.cover
      : (activeGallery.screenshots[selectedScreenshot] ?? activeGallery.cover);

  const trackWidth =
    track.length * CARD_WIDTH_PX + Math.max(0, track.length - 1) * CARD_GAP_PX;

  return (
    <section
      aria-label="注目＆おすすめ"
      className="w-full"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) {
          return;
        }
        setFocusWithin(false);
      }}
    >
      <h1 className="mb-4 text-xl font-bold text-white">注目＆おすすめ</h1>

      <div
        ref={viewportRef}
        className={`relative w-full overflow-hidden md:h-[350px] ${
          circular ? "" : "mx-auto md:max-w-[1000px]"
        }`}
      >
        <div
          className={`flex h-full items-stretch gap-3 ease-out ${
            transitionEnabled && !reducedMotion
              ? "transition-transform duration-300"
              : "transition-none"
          }`}
          style={{
            width: trackWidth,
            transform: `translateX(${translateX}px)`,
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {track.map((item) => {
            const isClone = item.clone != null;
            const active = !isClone && item.realIndex === safeIndex;
            const gallery = active
              ? { ...activeGallery, mainSrc: activeMainSrc }
              : (() => {
                  const g2 = slideGallery(item.game, thumbnails);
                  return { ...g2, mainSrc: g2.cover };
                })();

            return (
              <div
                key={item.key}
                className={`relative h-full w-full max-w-[1000px] shrink-0 md:w-[1000px] ${
                  active
                    ? "opacity-100"
                    : "opacity-[0.38] brightness-[0.82] transition-[opacity,filter] duration-200 hover:opacity-[0.52] hover:brightness-95"
                }`}
              >
                <div
                  className="h-full w-full"
                  {...(!active
                    ? ({ inert: true } as Record<string, unknown>)
                    : {})}
                  aria-hidden={!active}
                >
                  <FeaturedGameCard
                    game={item.game}
                    mainSrc={gallery.mainSrc}
                    extraSlots={gallery.extraSlots}
                    selectedScreenshot={active ? selectedScreenshot : null}
                    onSelectScreenshot={
                      active ? setSelectedScreenshot : () => undefined
                    }
                  />
                </div>

                {!active ? (
                  <button
                    type="button"
                    className="absolute inset-0 z-10 rounded-xl bg-transparent"
                    aria-label={`${item.game.title} を表示`}
                    tabIndex={isClone ? -1 : undefined}
                    onClick={() => {
                      if (item.clone === "leading") {
                        goToGame(item.realIndex, { direction: "prev" });
                      } else if (item.clone === "trailing") {
                        goToGame(item.realIndex, { direction: "next" });
                      } else {
                        goToGame(item.realIndex, { direction: "direct" });
                      }
                    }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="前の作品"
              className="absolute left-2 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
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
            onClick={() => goToGame(i, { direction: "direct" })}
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
