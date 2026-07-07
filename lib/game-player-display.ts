import { displayPhase } from "@/lib/development-phases";
import type { Game } from "@/lib/mock-games";
import {
  getPlayAccessBadgeLabel,
  getPlayAccessCtaLabel,
  type PlayAccessType,
} from "@/lib/play-access-type";
import type { ProjectReleaseStatus } from "@/lib/project-release-state";

export type PlayerFacingBadge = {
  id: string;
  label: string;
  emoji?: string;
  tone?: "completed" | "reopened" | "play-access" | "phase";
};

export function isReleasedForPlayerDisplay(
  releaseStatus: ProjectReleaseStatus | undefined,
): boolean {
  return releaseStatus === "released";
}

export function isReleaseReopenedForPlayerDisplay(
  releaseStatus: ProjectReleaseStatus | undefined,
): boolean {
  return releaseStatus === "release_reopened";
}

export function getCompletedProductBadge(): PlayerFacingBadge {
  return {
    id: "completed",
    emoji: "🏆",
    label: "完成品",
    tone: "completed",
  };
}

export function getReleaseReopenedBadge(): PlayerFacingBadge {
  return {
    id: "release-reopened",
    label: "正式版再調整中",
    tone: "reopened",
  };
}

export function getPlayAccessPlayerBadge(
  playAccessType: PlayAccessType | string | null | undefined,
): PlayerFacingBadge | null {
  const label = getPlayAccessBadgeLabel(playAccessType);
  if (!label) {
    return null;
  }
  return {
    id: `play-access-${playAccessType}`,
    label,
    tone: "play-access",
  };
}

/** Discovery / card badges — release prioritized over phase. */
export function getDiscoveryCardBadges(game: Game): PlayerFacingBadge[] {
  const badges: PlayerFacingBadge[] = [];

  if (isReleasedForPlayerDisplay(game.releaseStatus)) {
    badges.push(getCompletedProductBadge());
  } else if (isReleaseReopenedForPlayerDisplay(game.releaseStatus)) {
    badges.push(getReleaseReopenedBadge());
  }

  const playAccessBadge = getPlayAccessPlayerBadge(game.playAccessType);
  if (playAccessBadge) {
    badges.push(playAccessBadge);
  }

  return badges;
}

export function getDiscoveryCardPhaseLabel(game: Game): string | null {
  if (
    isReleasedForPlayerDisplay(game.releaseStatus) ||
    isReleaseReopenedForPlayerDisplay(game.releaseStatus)
  ) {
    return null;
  }
  if (!game.phase?.trim()) {
    return null;
  }
  return displayPhase(game.phase);
}

export function getPrimaryPlayCtaLabel(
  game: Pick<Game, "playAccessType" | "playUrl">,
  fallback = "プレイする",
): string {
  return getPlayAccessCtaLabel(game.playAccessType, fallback);
}

export function hasEverBeenReleasedForEdit(game: Game): boolean {
  return (
    game.releaseStatus === "released" ||
    game.releaseStatus === "release_reopened"
  );
}
