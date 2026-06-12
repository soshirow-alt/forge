type GameThumbnailProps = {
  thumbnailUrl?: string;
  status: string;
  aspectClassName?: string;
  statusClassName?: string;
  showStatus?: boolean;
};

export function GameThumbnail({
  thumbnailUrl,
  status,
  aspectClassName = "aspect-video",
  statusClassName = "absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-orange-400 backdrop-blur-sm",
  showStatus = true,
}: GameThumbnailProps) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 ${aspectClassName}`}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(249,115,22,0.15),transparent_60%)]" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-60" />
      {showStatus && <div className={statusClassName}>{status}</div>}
    </div>
  );
}
