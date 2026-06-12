import { getExternalLinks } from "@/lib/game-links";
import type { Game } from "@/lib/mock-games";
import { gameHasDownloadDistribution } from "@/lib/play-environment";
import {
  DownloadSafetyNote,
  ExternalLinkSafetyNote,
} from "@/components/play-safety-note";

type GameExternalLinksProps = Pick<
  Game,
  | "playUrl"
  | "steamUrl"
  | "itchUrl"
  | "githubUrl"
  | "discordUrl"
  | "officialUrl"
  | "tags"
> & {
  compact?: boolean;
};

export function GameExternalLinks({
  playUrl,
  steamUrl,
  itchUrl,
  githubUrl,
  discordUrl,
  officialUrl,
  tags = [],
  compact = false,
}: GameExternalLinksProps) {
  const links = getExternalLinks({
    steamUrl,
    itchUrl,
    githubUrl,
    discordUrl,
    officialUrl,
  });

  if (links.length === 0) {
    return null;
  }

  const showDownloadNote = gameHasDownloadDistribution({
    playUrl,
    tags,
  } as Game);

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
        外部リンク
      </h2>
      {showDownloadNote ? (
        <DownloadSafetyNote className={compact ? "mt-1.5 text-xs" : "mt-2"} />
      ) : (
        <ExternalLinkSafetyNote className={compact ? "mt-1.5 text-xs" : "mt-2"} />
      )}
      <div className={compact ? "mt-2 flex flex-wrap gap-2" : "mt-4 flex flex-wrap gap-3"}>
        {links.map((link) => (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={
              compact
                ? "rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-orange-500/50 hover:bg-zinc-900 hover:text-orange-400"
                : "rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-orange-500/50 hover:bg-zinc-900 hover:text-orange-400"
            }
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
