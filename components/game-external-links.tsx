"use client";

import { AuthGatedHint } from "@/components/auth-gated-hint";
import { useGames } from "@/components/games-provider";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { gameDetailReturnPath } from "@/lib/login-return-url";
import {
  getExternalLinks,
  PROJECT_LINKS_SECTION_TITLE,
  type ProjectExternalLinksInput,
} from "@/lib/game-links";
import { normalizeExternalUrl } from "@/lib/game-play-destinations";
import type { Game } from "@/lib/mock-games";
import { gameHasDownloadDistribution } from "@/lib/play-environment";
import {
  DownloadSafetyNote,
  ExternalLinkSafetyNote,
} from "@/components/play-safety-note";

type GameExternalLinksProps = Pick<Game, "playUrl" | "tags"> &
  ProjectExternalLinksInput & {
    compact?: boolean;
    gameId: string;
  };

export function GameExternalLinks({
  gameId,
  playUrl,
  steamUrl,
  itchUrl,
  githubUrl,
  discordUrl,
  officialUrl,
  xUrl,
  youtubeUrl,
  tags = [],
  compact = false,
}: GameExternalLinksProps) {
  const { isLoggedIn, isGuestEntry, requireAuth } = useRequireAuth();
  const { recordPlay } = useGames();
  const links = getExternalLinks({
    steamUrl,
    itchUrl,
    githubUrl,
    discordUrl,
    officialUrl,
    xUrl,
    youtubeUrl,
  })
    .map((link) => ({
      ...link,
      url: normalizeExternalUrl(link.url),
    }))
    .filter((link): link is { label: string; url: string } => Boolean(link.url));

  if (links.length === 0) {
    return null;
  }

  const showDownloadNote = gameHasDownloadDistribution({
    playUrl,
    tags,
  } as Game);

  const linkClassName = compact
    ? "rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-orange-500/50 hover:bg-zinc-900 hover:text-orange-400"
    : "rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-orange-500/50 hover:bg-zinc-900 hover:text-orange-400";

  return (
    <div
      className={
        compact
          ? "border-t border-zinc-800 pt-4"
          : "mt-8 border-t border-zinc-800 pt-8"
      }
    >
      <h2
        className={
          compact
            ? "text-xs font-medium text-zinc-500"
            : "text-sm font-medium text-zinc-500"
        }
      >
        {PROJECT_LINKS_SECTION_TITLE}
      </h2>
      {showDownloadNote ? (
        <DownloadSafetyNote className={compact ? "mt-1.5 text-xs" : "mt-2"} />
      ) : (
        <ExternalLinkSafetyNote className={compact ? "mt-1.5 text-xs" : "mt-2"} />
      )}
      {!isLoggedIn && !isGuestEntry && (
        <AuthGatedHint
          hint="ログインすると使えます"
          className={compact ? "mt-1.5" : "mt-2"}
        />
      )}
      <div
        className={
          compact ? "mt-2 flex flex-wrap gap-2" : "mt-4 flex flex-wrap gap-3"
        }
      >
        {links.map((link) =>
          isLoggedIn ? (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                void recordPlay(gameId).catch(() => undefined);
              }}
              className={linkClassName}
            >
              {link.label}
            </a>
          ) : isGuestEntry ? (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClassName}
            >
              {link.label}
            </a>
          ) : (
            <button
              key={link.label}
              type="button"
              onClick={() =>
                requireAuth(() => undefined, gameDetailReturnPath(gameId), {
                  variant: "play",
                })
              }
              title="ログインすると使えます"
              className={linkClassName}
            >
              {`ログインして${link.label}`}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
