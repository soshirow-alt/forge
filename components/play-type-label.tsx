import { getPlayTypeLabel } from "@/lib/game-links";

export function PlayTypeLabel({ playUrl }: { playUrl: string }) {
  return (
    <span className="inline-block rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400">
      {getPlayTypeLabel(playUrl)}
    </span>
  );
}
