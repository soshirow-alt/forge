"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AUTO_ADVANCE_MS = 5000;

export function GameDetailHeroGallery({ images }: { images: string[] }) {
  const slides = images.length > 0 ? images : ["/images/landing/game-1.png"];
  const [index, setIndex] = useState(0);
  const total = slides.length;

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
    <div className="group relative min-h-[220px] lg:min-h-[320px]">
      <Image src={slides[index]} alt="" fill className="object-cover" priority />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#0a0a0a]/40" />

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
