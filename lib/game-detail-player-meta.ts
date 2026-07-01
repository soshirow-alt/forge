import { displayPhase, getPhasePlayerDescription } from "@/lib/development-phases";
import {
  DISTRIBUTION_TYPE_LABELS,
  getDistributionType,
  getPlayEnvironmentLabels,
  supportsMobile,
  supportsPc,
  supportsBrowser,
} from "@/lib/play-environment";
import type { Game } from "@/lib/mock-games";

export type PlayerPlatformOption = {
  label: string;
  supported: boolean;
};

export type PlayerPlayInfoDisplay = {
  estimatedPlayTime: string | null;
  platformOptions: PlayerPlatformOption[];
  playMethodLabel: string | null;
};

export type GameDetailPlayerMeta = {
  phaseLabel: string;
  phaseDescription: string;
  estimatedPlayTime: string | null;
  environmentLabels: string[];
  playInfo: PlayerPlayInfoDisplay;
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

export function resolvePlayerPlayInfoDisplay(game: Game): PlayerPlayInfoDisplay {
  const distribution = getDistributionType(game);
  return {
    estimatedPlayTime: game.estimatedPlayTime?.trim() || null,
    platformOptions: [
      { label: "PC", supported: supportsPc(game) },
      { label: "スマホ", supported: supportsMobile(game) },
      { label: "ブラウザ", supported: supportsBrowser(game) },
    ],
    playMethodLabel: distribution ? DISTRIBUTION_TYPE_LABELS[distribution] : null,
  };
}

export function resolveGameDetailPlayerMeta(
  game: Game | null | undefined,
): GameDetailPlayerMeta | null {
  if (!game?.phase?.trim()) {
    return null;
  }

  const environmentLabels = getPlayEnvironmentLabels(game);
  const playInfo = resolvePlayerPlayInfoDisplay(game);

  return {
    phaseLabel: displayPhase(game.phase),
    phaseDescription: getPhasePlayerDescription(game.phase),
    estimatedPlayTime: game.estimatedPlayTime?.trim() || null,
    environmentLabels,
    playInfo,
    focusNotes: game.focusNotes?.trim() || null,
  };
}
