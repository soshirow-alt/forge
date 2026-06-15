"use client";

import { useEffect, useState } from "react";
import {
  GAME_VOICE_SECTION_ID,
  scrollToGameVoiceSection,
} from "@/lib/game-feedback-ui";

type PostPlayVoiceStickyCtaProps = {
  active: boolean;
};

export function PostPlayVoiceStickyCta({ active }: PostPlayVoiceStickyCtaProps) {
  const [showBar, setShowBar] = useState(false);

  useEffect(() => {
    if (!active) {
      setShowBar(false);
      return;
    }

    const target = document.getElementById(GAME_VOICE_SECTION_ID);
    if (!target) {
      setShowBar(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowBar(!entry.isIntersecting);
      },
      { root: null, rootMargin: "0px 0px -72px 0px", threshold: 0.08 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [active]);

  if (!active || !showBar) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <div className="pointer-events-auto border-t border-zinc-800/80 bg-zinc-950/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
        <button
          type="button"
          onClick={scrollToGameVoiceSection}
          className="block w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-center text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
        >
          返事を届ける
        </button>
      </div>
    </div>
  );
}
