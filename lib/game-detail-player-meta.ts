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

export type GameDetailOverviewActivity = {
  lastUpdated: string;
  hasDevlog: boolean;
  devlogLabel: string;
  voiceCount: number;
};

/**
 * 「いま見てほしいこと」の将来方針:
 * 概要タブでの手入力項目ではなく、最新の開発ログまたは版公開時の問いから自動反映する。
 * 現状は legacy の focusNotes（localStorage extras 等）のみ安全に表示する。
 */

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
