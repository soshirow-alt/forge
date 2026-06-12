type GameThumbnailProps = {
  thumbnailUrl?: string;
  status: string;
  aspectClassName?: string;
  statusClassName?: string;
};

export function GameThumbnail({
  thumbnailUrl,
  status,
  aspectClassName = "aspect-video",
  statusClassName = "absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-orange-400 backdrop-blur-sm",
}: GameThumbnailProps) {
  return (
    <div
      className={`relative bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 ${aspectClassName}`}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(249,115,22,0.15),transparent_60%)]" />
      )}
      <div className={statusClassName}>{status}</div>
    </div>
  );
}
