import { displayPhase, getPhasePlayerDescription } from "@/lib/development-phases";
import {
  getDistributionType,
  getPlayEnvironmentLabels,
  supportsMobile,
  supportsPc,
  type DistributionType,
} from "@/lib/play-environment";
import { getPlayAccessBadgeLabel } from "@/lib/play-access-type";
import {
  getCompletedProductBadge,
  getReleaseReopenedBadge,
  isReleaseReopenedForPlayerDisplay,
  isReleasedForPlayerDisplay,
} from "@/lib/game-player-display";
import { PLAY_TIME_OPTIONS } from "@/lib/play-time-options";
import { PLAYER_COUNT_OPTIONS } from "@/lib/project-formal-filter-registry";
import type { Game } from "@/lib/mock-games";

export type PlayerOptionChip = {
  label: string;
  active: boolean;
};

const PLAYER_PLAY_METHOD_OPTIONS: {
  id: Exclude<DistributionType, "">;
  label: string;
}[] = [
  { id: "browser", label: "ブラウザで遊ぶ" },
  { id: "download", label: "ダウンロードする" },
  { id: "external", label: "ストアで入手する" },
];

export type PlayerPlayInfoDisplay = {
  playTimeOptions: PlayerOptionChip[];
  deviceOptions: PlayerOptionChip[];
  playMethodOptions: PlayerOptionChip[];
  /** Selected player-count chips; empty/omitted = hide プレイ人数 row. */
  playerCountOptions?: PlayerOptionChip[];
};

export type GameDetailPlayerMeta = {
  phaseLabel: string;
  phaseDescription: string;
  releaseBadgeLabel: string | null;
  releaseBadgeEmoji?: string;
  releaseBadgeTone?: "completed" | "reopened";
  playAccessBadgeLabel: string | null;
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
  /** Distinct registered players; null = hide (RPC unavailable / not loaded). */
  playPlayerCount?: number | null;
  watchCount?: number | null;
  statsLoaded?: boolean;
};

/**
 * 「いま見てほしいこと」の将来方針:
 * 概要タブでの手入力項目ではなく、最新の開発ログまたは版公開時の問いから自動反映する。
 * 現状は legacy の focusNotes（localStorage extras 等）のみ安全に表示する。
 */

export function resolvePlayerPlayInfoDisplay(game: Game): PlayerPlayInfoDisplay {
  const distribution = getDistributionType(game);
  const selectedPlayTime = game.estimatedPlayTime?.trim() || null;
  const selectedCounts = new Set(
    (game.playerCounts ?? []).map((value) => value.trim()).filter(Boolean),
  );

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
    playerCountOptions: PLAYER_COUNT_OPTIONS.map((label) => ({
      label,
      active: selectedCounts.has(label),
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

  const completedBadge = isReleasedForPlayerDisplay(game.releaseStatus)
    ? getCompletedProductBadge()
    : null;
  const reopenedBadge = isReleaseReopenedForPlayerDisplay(game.releaseStatus)
    ? getReleaseReopenedBadge()
    : null;
  const releaseBadge = completedBadge ?? reopenedBadge;

  return {
    phaseLabel: displayPhase(game.phase),
    phaseDescription: getPhasePlayerDescription(game.phase),
    releaseBadgeLabel: releaseBadge?.label ?? null,
    releaseBadgeEmoji: releaseBadge?.emoji,
    releaseBadgeTone:
      releaseBadge?.tone === "completed" || releaseBadge?.tone === "reopened"
        ? releaseBadge.tone
        : undefined,
    playAccessBadgeLabel: getPlayAccessBadgeLabel(game.playAccessType),
    estimatedPlayTime: game.estimatedPlayTime?.trim() || null,
    environmentLabels,
    playInfo,
    focusNotes: game.focusNotes?.trim() || null,
  };
}
