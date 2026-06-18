"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { LP_REF_WIDTH } from "@/components/landing-mock-layout";

const SCALE_MIN_WIDTH = 1024;

type LandingPageScalerProps = {
  children: ReactNode;
};

/** モックアートボード（1024 幅・高さはコンテンツ連鎖）を viewport に max-fit 均一 scale */
export function LandingPageScaler({ children }: LandingPageScalerProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [scale, setScale] = useState(1);

  const updateLayout = useCallback(() => {
    const el = measureRef.current;
    if (!el) return;

    const height = el.offsetHeight;
    setContentHeight(height);

    if (window.innerWidth < SCALE_MIN_WIDTH) {
      setScale(1);
      return;
    }

    if (height <= 0) return;

    setScale(Math.min(window.innerWidth / LP_REF_WIDTH, window.innerHeight / height));
  }, []);

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    const observer = new ResizeObserver(updateLayout);
    observer.observe(el);
    window.addEventListener("resize", updateLayout);
    updateLayout();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateLayout);
    };
  }, [updateLayout]);

  const scaledWidth = LP_REF_WIDTH * scale;
  const scaledHeight = contentHeight * scale;
  const ready = contentHeight > 0;

  return (
    <div className="hidden min-h-dvh items-start justify-center overflow-x-hidden bg-[#050508] lg:flex">
      <div
        className="relative shrink-0"
        style={{
          width: ready ? scaledWidth : LP_REF_WIDTH,
          height: ready ? scaledHeight : undefined,
          visibility: ready ? "visible" : "hidden",
        }}
      >
        <div
          ref={measureRef}
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: LP_REF_WIDTH,
            transform: ready ? `scale(${scale})` : undefined,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export { LP_REF_WIDTH as LANDING_DESIGN_WIDTH };
