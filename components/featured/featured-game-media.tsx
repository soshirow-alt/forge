"use client";

import Image from "next/image";
import { GeneratedThumbnailPoster } from "@/components/generated-thumbnail-poster";

interface FeaturedGameMediaProps {
  src: string;
  alt: string;
  /** Used when src is empty — Forge fallback poster */
  projectId?: string;
  title?: string;
  genre?: string;
  version?: string;
}

/**
 * Left media area of the featured card.
 * Solid black background, image shown with object-contain so screenshots
 * of any aspect ratio (16:9, square, portrait) are fully visible, never
 * cropped, stretched, blurred, or duplicated.
 */
export function FeaturedGameMedia({
  src,
  alt,
  projectId,
  title,
  genre,
  version,
}: FeaturedGameMediaProps) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {src ? (
        <Image
          key={src}
          src={src}
          alt={alt}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 620px"
          priority
        />
      ) : projectId ? (
        <GeneratedThumbnailPoster
          projectId={projectId}
          title={title ?? ""}
          genre={genre ?? ""}
          phase={version ?? ""}
        />
      ) : null}
    </div>
  );
}
