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
>;

export function GameExternalLinks({
  playUrl,
  steamUrl,
  itchUrl,
  githubUrl,
  discordUrl,
  officialUrl,
  tags = [],
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
    <div className="mt-8 border-t border-zinc-800 pt-8">
      <h2 className="text-sm font-medium text-zinc-500">外部リンク</h2>
      {showDownloadNote ? (
        <DownloadSafetyNote className="mt-2" />
      ) : (
        <ExternalLinkSafetyNote className="mt-2" />
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-orange-500/50 hover:bg-zinc-900 hover:text-orange-400"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
