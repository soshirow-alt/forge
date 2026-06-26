import { sortDevlogsNewestFirst, type DevlogEntry } from "@/lib/devlogs";
import type { ConfirmationRequestDraft } from "@/lib/confirmation-request-draft";
import { hasConfirmationRequestContent } from "@/lib/confirmation-request-draft";
import type { Game } from "@/lib/mock-games";
import { formatNotificationDate, type Notification } from "@/lib/notifications";
import {
  buildPlayerUpdateBadgeLabel,
  buildPlayerUpdateHeadline,
  isVersionPublishDevlog,
} from "@/lib/player-update-display";
import {
  CHANGE_CHECK_SECTION_ID,
  gameHistoryHref,
  gamePlayHref,
  gameVersionBannerHref,
} from "@/lib/project-nurture-links";

export type PlayerUpdateItem = {
  id: string;
  game: Game;
  devlogId?: string;
  kind: "devlog" | "version_published";
  isVersionPublish: boolean;
  hasConfirmationRequest: boolean;
  badgeLabel: string;
  headline: string;
  date: string;
  detailsHref: string;
  replayHref: string;
};

function unionGames(watchedGames: Game[], playedGames: Game[]): Game[] {
  const map = new Map<string, Game>();
  for (const game of [...watchedGames, ...playedGames]) {
    map.set(game.id, game);
  }
  return [...map.values()];
}

function resolvePlayerUpdateContext(
  kind: PlayerUpdateItem["kind"],
  notification: Notification | undefined,
  latestDevlog: DevlogEntry | undefined,
): { isVersionPublish: boolean; publishedVersion?: string | null } {
  if (kind === "version_published") {
    return {
      isVersionPublish: true,
      publishedVersion:
        notification?.publishedVersion ?? latestDevlog?.publishedVersion,
    };
  }

  if (isVersionPublishDevlog(latestDevlog)) {
    return {
      isVersionPublish: true,
      publishedVersion: latestDevlog?.publishedVersion,
    };
  }

  return { isVersionPublish: false, publishedVersion: latestDevlog?.publishedVersion };
}

function draftFromRecord(
  record: ConfirmationRequestDraft | undefined,
): ConfirmationRequestDraft | null {
  if (!record || !hasConfirmationRequestContent(record)) {
    return null;
  }
  return record;
}

export function buildPlayerUpdates(input: {
  watchedGames: Game[];
  playedGames: Game[];
  notifications: Notification[];
  getDevlogsByProject: (projectId: string) => DevlogEntry[];
  confirmationsByDevlogId: Map<string, ConfirmationRequestDraft>;
}): PlayerUpdateItem[] {
  const sourceGames = unionGames(input.watchedGames, input.playedGames);
  const trackedIds = new Set(sourceGames.map((game) => game.id));
  const items = new Map<string, PlayerUpdateItem>();

  for (const notification of input.notifications) {
    if (!trackedIds.has(notification.projectId)) {
      continue;
    }

    if (
      notification.type !== "devlog" &&
      notification.type !== "version_published" &&
      notification.type !== "confirmation_request"
    ) {
      continue;
    }

    const game = sourceGames.find((entry) => entry.id === notification.projectId);
    if (!game) {
      continue;
    }

    const latestDevlog = sortDevlogsNewestFirst(
      input.getDevlogsByProject(notification.projectId),
    )[0];

    const kind =
      notification.type === "version_published"
        ? "version_published"
        : notification.type === "confirmation_request"
          ? "devlog"
          : "devlog";

    const updateContext = resolvePlayerUpdateContext(
      notification.type === "version_published" ? "version_published" : "devlog",
      notification,
      latestDevlog,
    );
    const confirmation = latestDevlog
      ? draftFromRecord(input.confirmationsByDevlogId.get(latestDevlog.id))
      : null;
    const hasConfirmationRequest =
      notification.type === "confirmation_request" || Boolean(confirmation);

    items.set(notification.id, {
      id: notification.id,
      game,
      devlogId: latestDevlog?.id,
      kind,
      isVersionPublish: updateContext.isVersionPublish,
      hasConfirmationRequest,
      badgeLabel: buildPlayerUpdateBadgeLabel({
        isVersionPublish: updateContext.isVersionPublish,
        hasConfirmationRequest,
      }),
      headline:
        notification.type === "confirmation_request"
          ? notification.message
          : buildPlayerUpdateHeadline({
              ...updateContext,
              confirmation,
            }),
      date: notification.date,
      detailsHref: hasConfirmationRequest
        ? `/games/${notification.projectId}#${CHANGE_CHECK_SECTION_ID}`
        : updateContext.isVersionPublish
          ? gameVersionBannerHref(notification.projectId)
          : gameHistoryHref(notification.projectId),
      replayHref: hasConfirmationRequest
        ? `/games/${notification.projectId}#${CHANGE_CHECK_SECTION_ID}`
        : updateContext.isVersionPublish
          ? gameVersionBannerHref(notification.projectId)
          : gamePlayHref(notification.projectId),
    });
  }

  for (const game of sourceGames) {
    const latestDevlog = sortDevlogsNewestFirst(
      input.getDevlogsByProject(game.id),
    )[0];

    if (!latestDevlog) {
      continue;
    }

    const fallbackId = `devlog-${game.id}-${latestDevlog.id}`;
    if (items.has(fallbackId)) {
      continue;
    }

    const updateContext = resolvePlayerUpdateContext("devlog", undefined, latestDevlog);
    const confirmation = draftFromRecord(
      input.confirmationsByDevlogId.get(latestDevlog.id),
    );
    const hasConfirmationRequest = Boolean(confirmation);
    const headline = buildPlayerUpdateHeadline({
      ...updateContext,
      confirmation,
    });

    const duplicateFromNotification = [...items.values()].some(
      (item) => item.game.id === game.id && item.headline === headline,
    );

    if (duplicateFromNotification) {
      continue;
    }

    items.set(fallbackId, {
      id: fallbackId,
      game,
      devlogId: latestDevlog.id,
      kind: "devlog",
      isVersionPublish: updateContext.isVersionPublish,
      hasConfirmationRequest,
      badgeLabel: buildPlayerUpdateBadgeLabel({
        isVersionPublish: updateContext.isVersionPublish,
        hasConfirmationRequest,
      }),
      headline,
      date: latestDevlog.date,
      detailsHref: hasConfirmationRequest
        ? `/games/${game.id}#${CHANGE_CHECK_SECTION_ID}`
        : gameHistoryHref(game.id),
      replayHref: hasConfirmationRequest
        ? `/games/${game.id}#${CHANGE_CHECK_SECTION_ID}`
        : gamePlayHref(game.id),
    });
  }

  return [...items.values()].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export { formatNotificationDate };
