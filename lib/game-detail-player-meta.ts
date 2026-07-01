import { displayPhase, getPhasePlayerDescription } from "@/lib/development-phases";
import { getPlayEnvironmentLabels } from "@/lib/play-environment";
import type { Game } from "@/lib/mock-games";

export type GameDetailPlayerMeta = {
  phaseLabel: string;
  phaseDescription: string;
  estimatedPlayTime: string | null;
  environmentLabels: string[];
  focusNotes: string | null;
};

export function resolveGameDetailPlayerMeta(
  game: Game | null | undefined,
): GameDetailPlayerMeta | null {
  if (!game?.phase?.trim()) {
    return null;
  }

  const environmentLabels = getPlayEnvironmentLabels(game);

  return {
    phaseLabel: displayPhase(game.phase),
    phaseDescription: getPhasePlayerDescription(game.phase),
    estimatedPlayTime: game.estimatedPlayTime?.trim() || null,
    environmentLabels,
    focusNotes: game.focusNotes?.trim() || null,
  };
}
