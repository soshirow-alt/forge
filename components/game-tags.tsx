import { getPublicGameTags } from "@/lib/play-environment";
import { displayGameTag } from "@/lib/user-labels";
import { getGameTags } from "@/lib/game-tags";

export function GameTags({ tags }: { tags?: string[] }) {
  const displayTags = getPublicGameTags(getGameTags(tags));

  if (displayTags.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {displayTags.map((tag) => (
        <span
          key={tag}
          className="rounded-md border border-zinc-700 bg-zinc-800/80 px-2 py-0.5 text-xs text-zinc-400"
        >
          {displayGameTag(tag)}
        </span>
      ))}
    </div>
  );
}
