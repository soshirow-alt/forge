"use client";

import { DiscoveryGameThumbnail } from "@/components/discovery-game-thumbnail";
import { publicProjectThumbnailPath } from "@/lib/public-project-thumbnail";

/**
 * Shared project thumbnail — always resolves via public thumbnail API path.
 * Never pass raw Storage / data URLs from callers for public surfaces.
 *
 * Variants (fixed aspect / sizes — do not stretch mini to card widths):
 * - mini: developer list featured works (~140px, 16:9)
 * - card: discovery / search / bookmarks cards
 * - profile: creator profile game grid
 * - hero: large home / featured surfaces
 * - chip: 48px notification / inline icons only
 * - compact: legacy alias of card (kept for call-site compatibility)
 */
export type ProjectThumbnailVariant =
  | "mini"
  | "card"
  | "profile"
  | "hero"
  | "chip"
  | "compact";

type VariantConfig = {
  className: string;
  sizes: string;
};

const VARIANT_CONFIG: Record<ProjectThumbnailVariant, VariantConfig> = {
  mini: {
    className: "aspect-video w-[140px] max-w-[160px] shrink-0 rounded-lg",
    sizes: "160px",
  },
  card: {
    className: "aspect-video w-full max-w-[380px] rounded-xl",
    sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px",
  },
  profile: {
    className: "aspect-video w-full rounded-xl",
    sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px",
  },
  hero: {
    className: "aspect-video w-full rounded-xl",
    sizes: "(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1000px",
  },
  chip: {
    className: "size-12 shrink-0 rounded-lg",
    sizes: "48px",
  },
  compact: {
    className: "aspect-video w-full rounded-lg",
    sizes: "(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 280px",
  },
};

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
  const config = VARIANT_CONFIG[variant];
  return (
    <DiscoveryGameThumbnail
      id={projectId}
      title={title}
      genre={genre}
      version={version}
      image={image}
      className={className ? `${config.className} ${className}` : config.className}
      sizes={sizes ?? config.sizes}
    />
  );
}
