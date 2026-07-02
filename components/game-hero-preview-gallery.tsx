"use client";

import { GameDetailHeroGallery } from "@/components/game-detail-hero-gallery";
import { GeneratedThumbnailPoster } from "@/components/generated-thumbnail-poster";

export type GameHeroPosterFallback = {
  projectId: string;
  title: string;
  genre: string;
  phase?: string;
  styleSeed?: string;
};

type GameHeroPreviewGalleryProps = {
  images: string[];
  posterFallback: GameHeroPosterFallback;
};

/** 画像ありはギャラリー、未設定時は GeneratedThumbnailPoster（Studio・公開ページ共通） */
export function GameHeroPreviewGallery({
  images,
  posterFallback,
}: GameHeroPreviewGalleryProps) {
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
