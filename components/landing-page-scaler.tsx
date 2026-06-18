"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/** 01 LP デザインキャンバス幅（モック基準） */
export const LANDING_DESIGN_WIDTH = 1920;
const SCALE_MIN_WIDTH = 1024;

type LandingPageScalerProps = {
  children: ReactNode;
};

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

    setScale(
      Math.min(window.innerWidth / LANDING_DESIGN_WIDTH, window.innerHeight / height),
    );
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

  const scaledWidth = LANDING_DESIGN_WIDTH * scale;
  const scaledHeight = contentHeight * scale;
  const ready = contentHeight > 0;

  return (
    <div className="hidden min-h-dvh items-start justify-center overflow-x-hidden bg-[#0a0a0f] lg:flex">
      <div
        className="relative shrink-0"
        style={{
          width: ready ? scaledWidth : LANDING_DESIGN_WIDTH,
          height: ready ? scaledHeight : undefined,
          visibility: ready ? "visible" : "hidden",
        }}
      >
        <div
          ref={measureRef}
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: LANDING_DESIGN_WIDTH,
            transform: ready ? `scale(${scale})` : undefined,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
