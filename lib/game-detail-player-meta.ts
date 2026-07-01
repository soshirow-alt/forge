import { displayPhase, getPhasePlayerDescription } from "@/lib/development-phases";
import {
  getDistributionType,
  getPlayEnvironmentLabels,
  supportsMobile,
  supportsPc,
  type DistributionType,
} from "@/lib/play-environment";
import { PLAY_TIME_OPTIONS } from "@/lib/play-time-options";
import type { Game } from "@/lib/mock-games";

export type PlayerOptionChip = {
  label: string;
  active: boolean;
};

const PLAYER_PLAY_METHOD_OPTIONS: {
  id: Exclude<DistributionType, "">;
  label: string;
}[] = [
  { id: "browser", label: "ブラウザで起動" },
  { id: "download", label: "ダウンロード" },
  { id: "external", label: "外部サイトで開く" },
];

export type PlayerPlayInfoDisplay = {
  playTimeOptions: PlayerOptionChip[];
  deviceOptions: PlayerOptionChip[];
  playMethodOptions: PlayerOptionChip[];
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
  const selectedPlayTime = game.estimatedPlayTime?.trim() || null;

  return {
    playTimeOptions: PLAY_TIME_OPTIONS.map((label) => ({
      label,
      active: Boolean(selectedPlayTime && label === selectedPlayTime),
    })),
    deviceOptions: [
      { label: "PC", active: supportsPc(game) },
      { label: "スマホ", active: supportsMobile(game) },
    ],
    playMethodOptions: PLAYER_PLAY_METHOD_OPTIONS.map((option) => ({
      label: option.label,
      active: distribution === option.id,
    })),
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
