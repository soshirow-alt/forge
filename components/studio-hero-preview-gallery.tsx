"use client";

import { GameDetailHeroGallery } from "@/components/game-detail-hero-gallery";
import { GeneratedThumbnailPoster } from "@/components/generated-thumbnail-poster";

export type StudioHeroPosterFallback = {
  projectId: string;
  title: string;
  genre: string;
  phase?: string;
  styleSeed?: string;
};

type StudioHeroPreviewGalleryProps = {
  images: string[];
  posterFallback: StudioHeroPosterFallback;
};

/** Studio 左プレビュー専用 — 未設定時は GeneratedThumbnailPoster（編集パネルと同型） */
export function StudioHeroPreviewGallery({
  images,
  posterFallback,
}: StudioHeroPreviewGalleryProps) {
  if (images.length > 0) {
    return <GameDetailHeroGallery images={images} />;
  }

  return (
    <div className="relative min-h-[220px] overflow-hidden bg-zinc-950 lg:min-h-[320px]">
      <GeneratedThumbnailPoster
        projectId={posterFallback.projectId}
        title={posterFallback.title}
        genre={posterFallback.genre}
        phase={posterFallback.phase ?? ""}
        styleSeed={posterFallback.styleSeed ?? posterFallback.projectId}
        className="absolute inset-0"
      />
    </div>
  );
}
