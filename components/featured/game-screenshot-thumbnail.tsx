"use client";

import Image from "next/image";

interface GameScreenshotThumbnailProps {
  src: string;
  alt: string;
  active: boolean;
  onSelect: () => void;
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
}: GameScreenshotThumbnailProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      aria-label={alt}
      className={`block aspect-video w-40 overflow-hidden rounded-md border bg-black transition ${
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
      />
    </button>
  );
}
