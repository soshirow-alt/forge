"use client";

import { useEffect, useState, type ReactNode } from "react";

/** 01 LP デザインキャンバス（モック基準） */
export const LANDING_DESIGN_WIDTH = 1920;
export const LANDING_DESIGN_HEIGHT = 1080;
const SCALE_MIN_WIDTH = 1024;

type LandingPageScalerProps = {
  children: ReactNode;
};

export function LandingPageScaler({ children }: LandingPageScalerProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (window.innerWidth < SCALE_MIN_WIDTH) {
        setScale(1);
        return;
      }
      const next = Math.min(
        window.innerWidth / LANDING_DESIGN_WIDTH,
        window.innerHeight / LANDING_DESIGN_HEIGHT,
      );
      setScale(next);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const scaledWidth = LANDING_DESIGN_WIDTH * scale;
  const scaledHeight = LANDING_DESIGN_HEIGHT * scale;

  return (
    <div className="hidden min-h-dvh justify-center overflow-x-hidden bg-[#0a0a0f] lg:flex">
      <div
        className="relative shrink-0"
        style={{ width: scaledWidth, height: scaledHeight }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: LANDING_DESIGN_WIDTH,
            height: LANDING_DESIGN_HEIGHT,
            transform: `scale(${scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
