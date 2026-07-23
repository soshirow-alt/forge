/**
 * Shared thumbnail frame for Explore Prototype cards / detail / related.
 * Local SVG assets — plain img avoids next/image SVG optimizer constraints.
 */

type ExplorePrototypeThumbProps = {
  src: string;
  alt: string;
  /** Card / related use cover; detail prefers contain so scene chrome stays readable */
  fit?: "cover" | "contain";
  className?: string;
  /** Aspect ratio utility classes, e.g. aspect-video */
  frameClassName?: string;
};

export function ExplorePrototypeThumb({
  src,
  alt,
  fit = "cover",
  className = "",
  frameClassName = "aspect-video",
}: ExplorePrototypeThumbProps) {
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-violet-900/70 via-zinc-800 to-zinc-900 ${frameClassName} ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={640}
        height={360}
        decoding="async"
        className={`absolute inset-0 h-full w-full ${fitClass} object-center`}
      />
    </div>
  );
}
