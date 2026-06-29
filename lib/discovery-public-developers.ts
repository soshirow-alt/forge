import type { DeveloperSearchResult } from "@/lib/developer-search-v0-mock-data";
import type { DeveloperProfile } from "@/lib/developer-profiles";
import { FORGE_GENRE_OPTIONS } from "@/lib/forge-genre-options";
import { pickFeatureTagsFromGameTags } from "@/lib/forge-feature-tag-options";
import { getGameCreatedTimestamp } from "@/lib/game-timestamp";
import type { Game } from "@/lib/mock-games";
import { resolveProjectGenres } from "@/lib/project-genres";
import { getPublicGameTags } from "@/lib/play-environment";
import { isGamePublic } from "@/lib/project-visibility";

const DEFAULT_AVATAR = "/images/landing/game-1.png";
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
): DeveloperSearchResult[] {
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
    const routeId = profile?.creatorId ?? `dev-${ownerId}`;
    const name =
      profile?.publicName ??
      ownerGames[0]?.ownerName ??
      ownerGames[0]?.creator ??
      "開発者";
    const handle = routeId.replace(/^dev-/, "").slice(0, 12);
    const gameThumbs = ownerGames
      .slice(0, 3)
      .map((game) => game.thumbnailUrl?.trim() || DEFAULT_AVATAR);
    const newestCreated = Math.max(...ownerGames.map(getGameCreatedTimestamp), 0);

    return {
      id: routeId,
      name,
      handle,
      avatar: gameThumbs[0] ?? DEFAULT_AVATAR,
      bio: profile?.profile ?? "",
      verified: true,
      isNew: newestCreated > 0 && Date.now() - newestCreated < NEW_DEVELOPER_MS,
      inDevelopment: ownerGames.filter((game) => game.releaseStatus !== "released")
        .length,
      completed: ownerGames.filter((game) => game.releaseStatus === "released").length,
      followers: followerCounts[ownerId] ?? 0,
      genres: collectGenres(ownerGames),
      gameThumbs,
      following: isFollowing(routeId),
    };
  });
}
