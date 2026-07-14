import type { DeveloperSearchResult } from "@/lib/developer-search-v0-mock-data";
import type { DeveloperProfile } from "@/lib/developer-profiles";
import { FORGE_GENRE_OPTIONS } from "@/lib/forge-genre-options";
import { pickFeatureTagsFromGameTags } from "@/lib/forge-feature-tag-options";
import { getGameCreatedTimestamp } from "@/lib/game-timestamp";
import type { Game } from "@/lib/mock-games";
import { resolveProjectGenres } from "@/lib/project-genres";
import { getPublicGameTags } from "@/lib/play-environment";
import { isGamePublic } from "@/lib/project-visibility";
import {
  publicBioOneLine,
  resolvePublicProfileDisplay,
} from "@/lib/public-profile-display";
import { publicProjectThumbnailPath } from "@/lib/public-project-thumbnail";

const NEW_DEVELOPER_MS = 30 * 24 * 60 * 60 * 1000;
const GENRE_SET = new Set<string>(FORGE_GENRE_OPTIONS);

function collectGenres(games: Game[]): string[] {
  const genres = new Set<string>();
  for (const game of games) {
    for (const genre of resolveProjectGenres(game)) {
      if (genre && GENRE_SET.has(genre)) {
        genres.add(genre);
      }
    }
    const featureTags = pickFeatureTagsFromGameTags(getPublicGameTags(game.tags));
    for (const tag of featureTags) {
      if (GENRE_SET.has(tag)) {
        genres.add(tag);
      }
    }
  }
  return [...genres].slice(0, 5);
}

export function buildPublicDeveloperSearchResults(
  profiles: DeveloperProfile[],
  games: Game[],
  followerCounts: Record<string, number>,
  isFollowing: (routeId: string) => boolean,
  options?: { followersLoaded?: boolean },
): DeveloperSearchResult[] {
  const followersLoaded = options?.followersLoaded ?? true;
  const publicGames = games.filter(isGamePublic);
  const ownerIds = [
    ...new Set(
      publicGames
        .map((game) => game.ownerId)
        .filter((ownerId): ownerId is string => Boolean(ownerId)),
    ),
  ];

  return ownerIds.map((ownerId) => {
    const ownerGames = publicGames.filter((game) => game.ownerId === ownerId);
    const profile = profiles.find((item) => item.userId === ownerId);
    const display = resolvePublicProfileDisplay(profile, {
      userId: ownerId,
      fallbackName:
        ownerGames[0]?.ownerName ?? ownerGames[0]?.creator ?? "開発者",
    });
    const newestCreated = Math.max(...ownerGames.map(getGameCreatedTimestamp), 0);
    const featuredWorks = ownerGames.slice(0, 3).map((game) => ({
      id: game.id,
      title: game.title,
      image: publicProjectThumbnailPath(game.id),
    }));

    return {
      id: display.routeId,
      userId: ownerId,
      name: display.displayName,
      handle: display.handle,
      avatar: display.avatarSrc,
      bio: publicBioOneLine(display.bio, 100),
      xAccount: display.xAccount,
      website: display.website,
      verified: true,
      isNew: newestCreated > 0 && Date.now() - newestCreated < NEW_DEVELOPER_MS,
      publicGameCount: ownerGames.length,
      followers: followersLoaded ? (followerCounts[ownerId] ?? 0) : null,
      genres: collectGenres(ownerGames),
      featuredWorks,
      /** @deprecated use featuredWorks */
      gameThumbs: featuredWorks.map((work) => work.image),
      /** @deprecated mixed-axis metric — prefer publicGameCount */
      inDevelopment: ownerGames.filter((game) => game.releaseStatus !== "released")
        .length,
      /** @deprecated mixed-axis metric — prefer publicGameCount */
      completed: ownerGames.filter((game) => game.releaseStatus === "released")
        .length,
      following: isFollowing(display.routeId),
    };
  });
}
