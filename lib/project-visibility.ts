import type { Game } from "@/lib/mock-games";

export type ProjectVisibility = "public" | "private";

export function isGamePublic(game: Pick<Game, "visibility">): boolean {
  return game.visibility !== "private";
}

export function getVisibilityBadgeLabel(
  visibility?: ProjectVisibility,
): "公開中" | "非公開" {
  return visibility === "private" ? "非公開" : "公開中";
}
