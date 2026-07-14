"use client";

import Image from "next/image";
import { useState } from "react";
import { GeneratedThumbnailPoster } from "@/components/generated-thumbnail-poster";
import { isUsableThumbnailBitmap } from "@/lib/thumbnail-bitmap";

function ThumbnailImage({
  id,
  title,
  genre,
  version,
  image,
  className,
  sizes,
}: {
  id: string;
  title: string;
  genre?: string;
  version?: string;
  image: string;
  className: string;
  sizes: string;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (failed) {
    return (
      <div className={`relative overflow-hidden bg-zinc-800 ${className}`}>
        <GeneratedThumbnailPoster
          projectId={id}
          title={title}
          genre={genre ?? ""}
          phase={version ?? ""}
          compact
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-zinc-800 ${className}`}>
      <Image
        src={image}
        alt=""
        fill
        className={`object-cover transition-opacity duration-200 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        sizes={sizes}
        loading="lazy"
        onLoad={(event) => {
          const img = event.currentTarget;
          if (!isUsableThumbnailBitmap(img.naturalWidth, img.naturalHeight)) {
            setFailed(true);
            return;
          }
          setLoaded(true);
        }}
        onError={() => setFailed(true)}
      />
      {!loaded ? (
        <div className="absolute inset-0 animate-pulse bg-zinc-800" aria-hidden />
      ) : null}
    </div>
  );
}

/**
 * Shared thumbnail image shell used by ProjectThumbnail.
 * No CSS blur / blurDataURL — soft look was from undersized srcset stretch.
 * Remount via `key={id:image}` resets load/error when the project or URL changes.
 */
export function DiscoveryGameThumbnail({
  id,
  title,
  genre,
  version,
  image,
  className = "w-full aspect-video",
  sizes = "(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 360px",
}: {
  id: string;
  title: string;
  genre?: string;
  version?: string;
  image?: string;
  className?: string;
  sizes?: string;
}) {
  const resolvedImage = image?.trim() || "";

  if (!resolvedImage) {
    return (
      <div className={`relative overflow-hidden bg-zinc-800 ${className}`}>
        <GeneratedThumbnailPoster
          projectId={id}
          title={title}
          genre={genre ?? ""}
          phase={version ?? ""}
          compact
        />
      </div>
    );
  }

  return (
    <ThumbnailImage
      key={`${id}:${resolvedImage}`}
      id={id}
      title={title}
      genre={genre}
      version={version}
      image={resolvedImage}
      className={className}
      sizes={sizes}
    />
  );
}
