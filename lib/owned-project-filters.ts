import type { Game } from "@/lib/mock-games";

/** Studio PJ 一覧ピル — 実データ（Supabase projects）用 */
export function matchesOwnedProjectPhaseFilter(
  game: Game,
  filterId: string,
): boolean {
  if (filterId === "all") {
    return true;
  }
  if (filterId === "draft") {
    return game.visibility === "private";
  }
  if (filterId === "official") {
    return (
      game.releaseStatus === "released" || game.releaseStatus === "release_reopened"
    );
  }
  if (filterId === "published") {
    return (
      game.visibility !== "private" &&
      game.releaseStatus !== "released" &&
      game.releaseStatus !== "release_reopened"
    );
  }
  return true;
}
