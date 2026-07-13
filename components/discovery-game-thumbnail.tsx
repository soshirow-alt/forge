"use client";

import Image from "next/image";
import { useState } from "react";
import { GeneratedThumbnailPoster } from "@/components/generated-thumbnail-poster";

export function DiscoveryGameThumbnail({
  id,
  title,
  genre,
  version,
  image,
  className = "w-full aspect-[4/3]",
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
  const resolvedImage = image?.trim();
  const [failedImage, setFailedImage] = useState<string | null>(null);

  if (resolvedImage && failedImage !== resolvedImage) {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-zinc-800 ${className}`}>
        <Image
          src={resolvedImage}
          alt=""
          fill
          className="object-cover"
          sizes={sizes}
          loading="lazy"
          onError={() => setFailedImage(resolvedImage)}
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl bg-zinc-800 ${className}`}>
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
