"use client";

import Image from "next/image";
import { useState } from "react";
import { MissingScreenshot } from "@/components/featured/missing-screenshot";

interface GameScreenshotThumbnailProps {
  src: string;
  alt: string;
  active: boolean;
  onSelect: () => void;
  /** Fit parent grid cell instead of fixed w-40 (Player IA compact card). */
  compact?: boolean;
}

/**
 * A ~160x90 additional screenshot. Clicking it swaps the main media.
 * Active thumbnail uses Forge violet ring (v0 used primary).
 */
export function GameScreenshotThumbnail({
  src,
  alt,
  active,
  onSelect,
  compact = false,
}: GameScreenshotThumbnailProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <MissingScreenshot compact={compact} />;
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      aria-label={alt}
      className={`block aspect-video overflow-hidden rounded-md border bg-black transition ${
        compact ? "min-w-0 w-full" : "w-40"
      } ${
        active
          ? "border-violet-500 ring-2 ring-violet-500"
          : "border-zinc-800 hover:border-zinc-600"
      }`}
    >
      <Image
        src={src}
        alt={alt}
        width={160}
        height={90}
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </button>
  );
}
