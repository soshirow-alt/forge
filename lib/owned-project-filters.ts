import type { Game } from "@/lib/mock-games";
import {
  DEVELOPMENT_PHASE_OPTIONS,
  normalizePhase,
  type DevelopmentPhase,
} from "@/lib/development-phases";

/** 公開状態（visibility） */
export const STUDIO_VISIBILITY_FILTER_OPTIONS = [
  { id: "all", label: "すべて" },
  { id: "public", label: "公開中" },
  { id: "draft", label: "下書き" },
] as const;

/** 開発フェーズ（projects.phase）— 正式版は含めない */
export const STUDIO_DEV_PHASE_FILTER_OPTIONS = [
  { id: "all", label: "すべて" },
  { id: "試作版", label: "試作版" },
  { id: "プレイ可能版", label: "α版" },
  { id: "通しプレイ版", label: "β版" },
  { id: "公開準備中", label: "公開準備中" },
] as const;

export type StudioVisibilityFilterId =
  (typeof STUDIO_VISIBILITY_FILTER_OPTIONS)[number]["id"];
export type StudioDevPhaseFilterId =
  (typeof STUDIO_DEV_PHASE_FILTER_OPTIONS)[number]["id"];

export function matchesOwnedProjectVisibilityFilter(
  game: Game,
  filterId: string,
): boolean {
  if (filterId === "all") return true;
  if (filterId === "draft") return game.visibility === "private";
  if (filterId === "public") return game.visibility !== "private";
  return true;
}

export function matchesOwnedProjectDevPhaseFilter(
  game: Game,
  filterId: string,
): boolean {
  if (filterId === "all") return true;
  const phase = normalizePhase(game.phase);
  return phase === filterId;
}

/** 正式版公開済み（release_status）— 公開状態・開発フェーズと別に扱う */
export function isOwnedProjectOfficiallyReleased(game: Game): boolean {
  return (
    game.releaseStatus === "released" || game.releaseStatus === "release_reopened"
  );
}

export function matchesOwnedProjectOfficialFilter(
  game: Game,
  onlyOfficial: boolean,
): boolean {
  if (!onlyOfficial) return true;
  return isOwnedProjectOfficiallyReleased(game);
}

/** @deprecated mixed-axis — prefer the three helpers above */
export function matchesOwnedProjectPhaseFilter(
  game: Game,
  filterId: string,
): boolean {
  if (filterId === "all") return true;
  if (filterId === "draft") return game.visibility === "private";
  if (filterId === "official") return isOwnedProjectOfficiallyReleased(game);
  if (filterId === "published") {
    return (
      game.visibility !== "private" && !isOwnedProjectOfficiallyReleased(game)
    );
  }
  return true;
}

export function ownedProjectVisibilityLabel(game: Game): string {
  return game.visibility === "private" ? "下書き" : "公開中";
}

export function ownedProjectPhaseLabel(game: Game): string {
  const phase = normalizePhase(game.phase);
  const option = DEVELOPMENT_PHASE_OPTIONS.find((item) => item.value === phase);
  if (option) {
    // フィルター表記に合わせ、正式版候補は公開準備中と併記しない（badge は display）
    return option.label === "正式版候補" ? "公開準備中" : option.label;
  }
  return String(phase);
}

export type { DevelopmentPhase };
