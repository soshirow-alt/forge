"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AUTO_ADVANCE_MS = 5000;

function GallerySlide({ src, active }: { src: string; active: boolean }) {
  const visibility = active ? "opacity-100" : "opacity-0";

  if (src.startsWith("data:") || src.startsWith("blob:")) {
    return (
      <div
        className={`absolute inset-0 flex items-center justify-center bg-zinc-950 transition-opacity duration-700 ${visibility}`}
      >
        <img src={src} alt="" className="max-h-full max-w-full object-contain" />
      </div>
    );
  }

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center bg-zinc-950 transition-opacity duration-700 ${visibility}`}
    >
      <Image
        src={src}
        alt=""
        fill
        className="object-contain"
        sizes="(max-width: 1024px) 100vw, 60vw"
        priority={active}
      />
    </div>
  );
}

export function GameDetailHeroGallery({
  images,
  emptyPlaceholder,
}: {
  images: string[];
  emptyPlaceholder?: string;
}) {
  if (images.length === 0 && emptyPlaceholder) {
    return (
      <div className="flex min-h-[220px] items-center justify-center border border-dashed border-zinc-800/80 bg-zinc-950/40 px-6 text-center lg:min-h-[320px]">
        <p className="text-sm text-zinc-600">{emptyPlaceholder}</p>
      </div>
    );
  }

  const slides = images.length > 0 ? images : ["/images/landing/game-1.png"];
  const [index, setIndex] = useState(0);
  const total = slides.length;

  useEffect(() => {
    setIndex(0);
  }, [slides.join("|")]);

  useEffect(() => {
    if (total <= 1) {
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % total);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [total]);

  function goPrev() {
    setIndex((current) => (current === 0 ? total - 1 : current - 1));
  }

  function goNext() {
    setIndex((current) => (current + 1) % total);
  }

  return (
    <div className="group relative min-h-[220px] overflow-hidden bg-zinc-950 lg:min-h-[320px]">
      {slides.map((src, slideIndex) => (
        <GallerySlide key={`${slideIndex}-${src.slice(0, 48)}`} src={src} active={slideIndex === index} />
      ))}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/50 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#0a0a0a]/25" />

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-zinc-700/80 bg-zinc-950/80 p-2 text-zinc-200 opacity-0 transition-opacity hover:border-zinc-600 group-hover:opacity-100"
            aria-label="前の画像"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-zinc-700/80 bg-zinc-950/80 p-2 text-zinc-200 opacity-0 transition-opacity hover:border-zinc-600 group-hover:opacity-100"
            aria-label="次の画像"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {slides.map((_, dotIndex) => (
              <button
                key={dotIndex}
                type="button"
                onClick={() => setIndex(dotIndex)}
                className={`size-2 rounded-full transition-colors ${
                  dotIndex === index ? "bg-white" : "bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`画像 ${dotIndex + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
