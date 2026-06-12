"use client";

import { useGames } from "@/components/games-provider";

export function DevlogUpdateBadge({ projectId }: { projectId: string }) {
  const { hasDevlogs } = useGames();

  if (!hasDevlogs(projectId)) {
    return null;
  }

  return (
    <span className="rounded-md bg-orange-500/20 px-2 py-0.5 text-xs font-medium text-orange-400">
      更新あり
    </span>
  );
}
