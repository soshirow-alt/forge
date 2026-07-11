"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
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
/**
 * Desktop viewport when ≥3 slides: 200 + 12 + 1000 + 12 + 200 = 1424
 * so ~200px of the neighbor full cards peek on each side.
 */
const PEEK_VIEWPORT_PX = 1424;

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

export function FeaturedGameCarousel({
  slides,
  thumbnails,
}: {
  slides: HomeDiscoveryCard[];
  thumbnails: FeaturedThumbnailsState;
}) {
  const games = slides;
  const count = games.length;

  const [gameIndex, setGameIndex] = useState(0);
  const [selectedScreenshot, setSelectedScreenshot] = useState<number | null>(
    null,
  );
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(PEEK_VIEWPORT_PX);

  const safeIndex = count > 0 ? gameIndex % count : 0;
  const showNeighborPeeks = count >= 3;

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => {
      setViewportWidth(el.clientWidth || PEEK_VIEWPORT_PX);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [count, showNeighborPeeks]);

  const translateX = useMemo(() => {
    const step = CARD_WIDTH_PX + CARD_GAP_PX;
    const cardCenter = safeIndex * step + CARD_WIDTH_PX / 2;
    return viewportWidth / 2 - cardCenter;
  }, [safeIndex, viewportWidth]);

  function goToGame(index: number) {
    if (count === 0) return;
    const next = ((index % count) + count) % count;
    setGameIndex(next);
    setSelectedScreenshot(null);
  }

  if (count === 0) {
    return null;
  }

  const activeGame = games[safeIndex]!;
  const activeGallery = slideGallery(activeGame, thumbnails);
  const activeMainSrc =
    selectedScreenshot === null
      ? activeGallery.cover
      : (activeGallery.screenshots[selectedScreenshot] ?? activeGallery.cover);

  return (
    <section aria-label="注目＆おすすめ" className="w-full">
      <h1 className="mb-4 text-xl font-bold text-white">注目＆おすすめ</h1>

      <div
        ref={viewportRef}
        className={`relative mx-auto overflow-hidden md:h-[350px] ${
          showNeighborPeeks ? "md:max-w-[1424px]" : "md:max-w-[1000px]"
        }`}
      >
        <div
          className="flex h-full items-stretch gap-3 transition-transform duration-300 ease-out"
          style={{
            width: count * CARD_WIDTH_PX + Math.max(0, count - 1) * CARD_GAP_PX,
            transform: `translateX(${translateX}px)`,
          }}
        >
          {games.map((g, i) => {
            const active = i === safeIndex;
            const gallery = active
              ? { ...activeGallery, mainSrc: activeMainSrc }
              : (() => {
                  const g2 = slideGallery(g, thumbnails);
                  return { ...g2, mainSrc: g2.cover };
                })();

            return (
              <div
                key={`${g.id}-${g.heroSource ?? "hero"}`}
                className="relative h-full w-full max-w-[1000px] shrink-0 md:w-[1000px]"
              >
                <div
                  className="h-full w-full"
                  {...(!active ? ({ inert: true } as Record<string, unknown>) : {})}
                  aria-hidden={!active}
                >
                  <FeaturedGameCard
                    game={g}
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
                    className="absolute inset-0 z-10 rounded-xl bg-black/60 transition-colors hover:bg-black/50"
                    aria-label={`${g.title} を表示`}
                    onClick={() => goToGame(i)}
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
              onClick={() => goToGame(safeIndex - 1)}
              aria-label="前の作品"
              className="absolute left-2 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => goToGame(safeIndex + 1)}
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
