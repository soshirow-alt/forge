import { GeneratedThumbnailPoster } from "@/components/generated-thumbnail-poster";
import { GameThumbnail } from "@/components/player-shell";

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

  if (resolvedImage) {
    return (
      <GameThumbnail
        src={resolvedImage}
        alt={title}
        className={className}
        sizes={sizes}
      />
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
