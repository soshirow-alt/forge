"use client";

import { DiscoveryGameThumbnail } from "@/components/discovery-game-thumbnail";
import { publicProjectThumbnailPath } from "@/lib/public-project-thumbnail";

export type ProjectThumbnailVariant = "card" | "compact" | "hero" | "chip";

const VARIANT_CLASS: Record<ProjectThumbnailVariant, string> = {
  card: "aspect-[4/3] w-full rounded-xl",
  compact: "aspect-[4/3] w-full rounded-lg",
  hero: "aspect-video w-full rounded-xl",
  chip: "size-12 rounded-lg",
};

/**
 * Shared project thumbnail — always resolves via public thumbnail API path.
 * Never pass raw Storage / data URLs from callers for public surfaces.
 */
export function ProjectThumbnail({
  projectId,
  title,
  genre,
  version,
  variant = "card",
  className,
  sizes,
}: {
  projectId: string;
  title: string;
  genre?: string;
  version?: string;
  variant?: ProjectThumbnailVariant;
  className?: string;
  sizes?: string;
}) {
  const image = publicProjectThumbnailPath(projectId);
  const base = VARIANT_CLASS[variant];
  return (
    <DiscoveryGameThumbnail
      id={projectId}
      title={title}
      genre={genre}
      version={version}
      image={image}
      className={className ? `${base} ${className}` : base}
      sizes={
        sizes ??
        (variant === "chip"
          ? "48px"
          : "(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 360px")
      }
    />
  );
}
