import type { Game } from "@/lib/mock-games";
import {
  isUpdatedSinceLastPlay,
  type MeaningfulUpdateByProject,
} from "@/lib/meaningful-update-signals";
import {
  gameHistoryHref,
  gamePlayHref,
  adoptionVerifyHref,
} from "@/lib/project-nurture-links";
import { resolveHasPlayedLatestVersion } from "@/lib/player-project-involvement";
import type { ProjectPlaySession } from "@/lib/supabase/play-sessions-db";
import type { VoiceAdoptionRow } from "@/lib/voice-adoption/types";

export type MypageWatchStatusId =
  | "updated_since_play"
  | "new_version"
  | "latest_unplayed"
  | "fb_reflected"
  | "none";

export type MypageWatchFilterId =
  | "all"
  | "has_update"
  | "no_update"
  | "fb_reflected";

export type MypageWatchCardModel = {
  projectId: string;
  game: Game;
  /** Primary chip — strongest accurate signal */
  primaryStatus: MypageWatchStatusId;
  /** All accurate chips to show (deduped) */
  statusChips: { id: MypageWatchStatusId; label: string }[];
  hasUpdate: boolean;
  fbReflected: boolean;
  meaningfulUpdateAt: string | null;
  lastPlayedAt: string | null;
  latestVersion: string | null;
  summary: string | null;
  playHref: string;
  detailsHref: string;
  updatesHref: string;
  adoptionHref: string | null;
  sortKey: number;
};

export const MYPAGE_WATCH_STATUS_LABEL: Record<MypageWatchStatusId, string> = {
  updated_since_play: "前回確認後に更新",
  new_version: "新バージョン公開",
  latest_unplayed: "最新ver未確認",
  fb_reflected: "あなたのFBを参考に更新",
  none: "更新なし",
};

export const MYPAGE_WATCH_FILTER_OPTIONS: {
  id: MypageWatchFilterId;
  label: string;
}[] = [
  { id: "all", label: "すべて" },
  { id: "has_update", label: "更新あり" },
  { id: "no_update", label: "更新なし" },
  { id: "fb_reflected", label: "FBが反映された" },
];

const STATUS_PRIORITY: MypageWatchStatusId[] = [
  "fb_reflected",
  "updated_since_play",
  "new_version",
  "latest_unplayed",
  "none",
];

function latestSessionAt(
  sessions: ProjectPlaySession[],
  projectId: string,
): string | null {
  let best: string | null = null;
  let bestMs = -1;
  for (const session of sessions) {
    if (session.projectId !== projectId) {
      continue;
    }
    const ms = new Date(session.playedAt).getTime();
    if (!Number.isFinite(ms)) {
      continue;
    }
    if (ms > bestMs) {
      bestMs = ms;
      best = session.playedAt;
    }
  }
  return best;
}

function truncateSummary(text: string | null | undefined, max = 120): string | null {
  const trimmed = text?.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 1)}…`;
}

export function buildMypageWatchCards(input: {
  watchedGames: Game[];
  sessions: ProjectPlaySession[];
  meaningfulByProject: Map<string, MeaningfulUpdateByProject>;
  /** Active adoptions keyed by projectId (only pass when PLAYER_VISIBLE). */
  adoptionsByProject: Map<string, VoiceAdoptionRow>;
  /** Optional short copy from latest non-initial update — do not invent. */
  summaryByProject?: Map<string, string | null>;
}): MypageWatchCardModel[] {
  const cards: MypageWatchCardModel[] = [];

  for (const game of input.watchedGames) {
    const meaningful = input.meaningfulByProject.get(game.id) ?? null;
    const projectSessions = input.sessions.filter(
      (session) => session.projectId === game.id,
    );
    const lastPlayedAt = latestSessionAt(input.sessions, game.id);
    const adoption = input.adoptionsByProject.get(game.id) ?? null;
    const updatedSincePlay = isUpdatedSinceLastPlay({
      meaningfulUpdateAt: meaningful?.at,
      lastPlayedAt,
    });
    const hasPlayedLatest = resolveHasPlayedLatestVersion({
      sessions: projectSessions,
      firstPlayedAt: lastPlayedAt,
      playableVersion: game.playableVersion,
    });
    // 「最新版未プレイ」= 一度はプレイしたことがあるが最新ver未プレイ。未プレイ追跡だけに出さない。
    const latestUnplayed =
      projectSessions.length > 0 && hasPlayedLatest === false;
    const newVersion =
      Boolean(meaningful?.hasVersionEvent) &&
      (updatedSincePlay || latestUnplayed);

    const statuses: MypageWatchStatusId[] = [];
    if (adoption) {
      statuses.push("fb_reflected");
    }
    if (updatedSincePlay) {
      statuses.push("updated_since_play");
    }
    if (newVersion && !updatedSincePlay) {
      // Avoid stacking synonymous chips when updated_since_play already covers it.
      statuses.push("new_version");
    } else if (newVersion && updatedSincePlay && meaningful?.hasVersionEvent) {
      statuses.push("new_version");
    }
    if (latestUnplayed) {
      statuses.push("latest_unplayed");
    }
    if (statuses.length === 0) {
      statuses.push("none");
    }

    const unique = [...new Set(statuses)];
    unique.sort(
      (a, b) => STATUS_PRIORITY.indexOf(a) - STATUS_PRIORITY.indexOf(b),
    );
    const primaryStatus = unique[0] ?? "none";
    const hasUpdate = unique.some((id) => id !== "none");

    const updateMs = meaningful?.at
      ? new Date(meaningful.at).getTime()
      : Number.NEGATIVE_INFINITY;
    const sortKey = hasUpdate
      ? (Number.isFinite(updateMs) ? updateMs : Date.now())
      : Number.NEGATIVE_INFINITY + (lastPlayedAt
          ? new Date(lastPlayedAt).getTime()
          : 0);

    const summary =
      truncateSummary(adoption?.updateSummary) ??
      truncateSummary(input.summaryByProject?.get(game.id)) ??
      null;

    cards.push({
      projectId: game.id,
      game,
      primaryStatus,
      statusChips: unique.map((id) => ({
        id,
        label: MYPAGE_WATCH_STATUS_LABEL[id],
      })),
      hasUpdate,
      fbReflected: Boolean(adoption),
      meaningfulUpdateAt: meaningful?.at ?? null,
      lastPlayedAt,
      latestVersion: game.playableVersion?.trim() || null,
      summary,
      playHref: gamePlayHref(game.id),
      detailsHref: gamePlayHref(game.id),
      updatesHref: gameHistoryHref(game.id),
      adoptionHref: adoption
        ? adoptionVerifyHref(game.id, adoption.id)
        : null,
      sortKey,
    });
  }

  cards.sort((a, b) => {
    if (a.hasUpdate !== b.hasUpdate) {
      return a.hasUpdate ? -1 : 1;
    }
    if (b.sortKey !== a.sortKey) {
      return b.sortKey - a.sortKey;
    }
    return a.game.title.localeCompare(b.game.title, "ja");
  });

  return cards;
}

export function filterMypageWatchCards(
  cards: MypageWatchCardModel[],
  filter: MypageWatchFilterId,
): MypageWatchCardModel[] {
  switch (filter) {
    case "has_update":
      return cards.filter((card) => card.hasUpdate);
    case "no_update":
      return cards.filter((card) => !card.hasUpdate);
    case "fb_reflected":
      return cards.filter((card) => card.fbReflected);
    case "all":
    default:
      return cards;
  }
}

export function countMypageWatchFilters(
  cards: MypageWatchCardModel[],
  includeFbFilter: boolean,
): { id: MypageWatchFilterId; label: string; count: number }[] {
  const base = MYPAGE_WATCH_FILTER_OPTIONS.filter(
    (option) => includeFbFilter || option.id !== "fb_reflected",
  );
  return base.map((option) => ({
    ...option,
    count: filterMypageWatchCards(cards, option.id).length,
  }));
}

export function mypageWatchProjectHref(projectId: string): string {
  return `/mypage?tab=witnessing&project=${encodeURIComponent(projectId)}`;
}
