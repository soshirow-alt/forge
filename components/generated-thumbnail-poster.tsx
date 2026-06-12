import {
  getPosterStyle,
  type PosterPattern,
} from "@/lib/generated-thumbnail-style";

type GeneratedThumbnailPosterProps = {
  projectId: string;
  title: string;
  genre: string;
  phase: string;
  className?: string;
  compact?: boolean;
};

function PatternOverlay({ pattern }: { pattern: PosterPattern }) {
  if (pattern === "grid") {
    return (
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
    );
  }

  if (pattern === "diagonal") {
    return (
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.45) 0, rgba(255,255,255,0.45) 1px, transparent 1px, transparent 18px)",
        }}
      />
    );
  }

  if (pattern === "rings") {
    return (
      <>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full border border-white/10" />
        <div className="absolute -right-4 -top-4 h-28 w-28 rounded-full border border-white/10" />
        <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full border border-white/[0.07]" />
      </>
    );
  }

  return (
    <div
      className="absolute inset-0 opacity-20"
      style={{
        backgroundImage:
          "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.25) 50%, transparent 65%)",
      }}
    />
  );
}

export function GeneratedThumbnailPoster({
  projectId,
  title,
  genre,
  phase,
  className = "",
  compact = false,
}: GeneratedThumbnailPosterProps) {
  const seed = `${projectId}:${title}:${genre}`;
  const { palette, pattern, rotation } = getPosterStyle(seed);
  const displayTitle = title.trim() || "Untitled Project";

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(145deg, ${palette.from} 0%, ${palette.via} 42%, ${palette.to} 100%)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background: `radial-gradient(circle at 18% 22%, ${palette.glow}, transparent 52%)`,
        }}
      />
      <PatternOverlay pattern={pattern} />

      <div
        className="absolute right-[-10%] top-[-20%] h-[70%] w-[55%] rounded-[32px] border border-white/10 bg-white/[0.04] backdrop-blur-[1px]"
        style={{ transform: `rotate(${rotation}deg)` }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />

      <div
        className={`relative flex h-full flex-col justify-between ${compact ? "p-4" : "p-5 sm:p-6"}`}
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className="rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75 backdrop-blur-sm"
            style={{ color: palette.accent }}
          >
            {genre || "Indie"}
          </span>
          <span className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-medium text-white/70 backdrop-blur-sm">
            {phase}
          </span>
        </div>

        <div>
          <p
            className={`font-bold leading-tight tracking-tight text-white drop-shadow-lg ${compact ? "text-lg sm:text-xl" : "text-xl sm:text-2xl lg:text-3xl"}`}
            style={{
              display: "-webkit-box",
              WebkitLineClamp: compact ? 2 : 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {displayTitle}
          </p>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-widest text-white/45">
            Forge Original
          </p>
        </div>
      </div>
    </div>
  );
}
