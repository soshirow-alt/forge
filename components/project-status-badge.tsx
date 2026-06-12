import { getProjectStatusLabel } from "@/lib/project-activity";
import type { Game } from "@/lib/mock-games";

type ProjectStatusBadgeProps = {
  game: Pick<Game, "id" | "lastUpdated" | "createdAt">;
  compact?: boolean;
};

export function ProjectStatusBadge({
  game,
  compact = false,
}: ProjectStatusBadgeProps) {
  const label = getProjectStatusLabel(game);

  if (!label) {
    return null;
  }

  const isRecent =
    label.includes("今日") ||
    label.includes("昨日") ||
    label.includes("日前更新");

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${
        compact
          ? "px-2 py-0.5 text-[10px]"
          : "px-2.5 py-0.5 text-[11px]"
      } ${
        isRecent
          ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-300"
          : "border-zinc-600/50 bg-zinc-800/60 text-zinc-400"
      }`}
    >
      {label}
    </span>
  );
}
