"use client";

import { useEffect, useMemo } from "react";
import { useGames } from "@/components/games-provider";
import type { DevlogEntry } from "@/lib/devlogs";
import { resolveDeveloperSocialLinksForDisplay } from "@/lib/developer-external-link-defaults";
import { resolveOwnerUserIdFromRouteId } from "@/lib/developer-profiles";
import { displayPhase } from "@/lib/development-phases";
import type { Game } from "@/lib/mock-games";
import { pickFeatureTagsFromGameTags } from "@/lib/forge-feature-tag-options";
import { resolveProjectGenres } from "@/lib/project-genres";
import { getPublicGameTags } from "@/lib/play-environment";
import { isGamePublic } from "@/lib/project-visibility";
import { publicProjectThumbnailPath } from "@/lib/public-project-thumbnail";
import {
  publicBioOneLine,
  resolvePublicProfileDisplay,
} from "@/lib/public-profile-display";

export type CreatorProfileGameCard = {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  phaseLabel: string;
  lastUpdated: string;
};

export type CreatorProfileResolved = {
  routeId: string;
  creatorId: string;
  userId: string;
  name: string;
  handle: string;
  bio: string;
  avatar: string;
  website?: string;
  xAccount?: string;
  discordUrl?: string;
  youtubeUrl?: string;
  games: CreatorProfileGameCard[];
  recentDevlogs: {
    id: string;
    gameId: string;
    gameTitle: string;
    date: string;
    title: string;
    excerpt: string;
  }[];
  stats: {
    gameCount: number;
    devlogCount: number;
  };
};

function oneLineDescription(text: string): string {
  return publicBioOneLine(text, 80);
}

function gameToCreatorCard(game: Game): CreatorProfileGameCard {
  const genres = resolveProjectGenres(game);
  const featureTags = pickFeatureTagsFromGameTags(getPublicGameTags(game.tags));
  const tags = [...genres, ...featureTags];
  return {
    id: game.id,
    title: game.title,
    description: oneLineDescription(game.description ?? ""),
    image: publicProjectThumbnailPath(game.id),
    tags,
    phaseLabel: displayPhase(game.phase || game.status || ""),
    lastUpdated: game.lastUpdated,
  };
}

function buildRecentDevlogs(
  games: Game[],
  devlogs: DevlogEntry[],
): CreatorProfileResolved["recentDevlogs"] {
  const gameIds = new Set(games.map((game) => game.id));
  const titleById = new Map(games.map((game) => [game.id, game.title]));

  return devlogs
    .filter((entry) => gameIds.has(entry.projectId))
    .slice(0, 8)
    .map((entry) => ({
      id: entry.id,
      gameId: entry.projectId,
      gameTitle: titleById.get(entry.projectId) ?? "作品",
      date: entry.date,
      title: entry.title,
      excerpt:
        entry.content.length > 120
          ? `${entry.content.slice(0, 120)}…`
          : entry.content,
    }));
}

export function useCreatorProfile(routeId: string) {
  const {
    getDeveloperProfileByRouteId,
    submittedGames,
    publicGames,
    publicCatalogReady,
    developerProfilesReady,
    refreshPublicCatalog,
    getDevlogsByProject,
    dataReady,
  } = useGames();

  useEffect(() => {
    void refreshPublicCatalog();
  }, [refreshPublicCatalog, routeId]);

  const resolved = useMemo(() => {
    const stored = getDeveloperProfileByRouteId(routeId);
    const userId =
      stored?.userId ?? resolveOwnerUserIdFromRouteId(routeId) ?? null;

    if (!userId) {
      return null;
    }

    const byId = new Map<string, Game>();
    for (const game of publicGames) {
      if (game.ownerId === userId && isGamePublic(game)) {
        byId.set(game.id, game);
      }
    }
    // Owner catalog may arrive before public catalog; include owned public games.
    for (const game of submittedGames) {
      if (game.ownerId === userId && isGamePublic(game) && !byId.has(game.id)) {
        byId.set(game.id, game);
      }
    }
    const ownerGames = [...byId.values()];
    const allOwnerGames = [
      ...publicGames.filter((game) => game.ownerId === userId),
      ...submittedGames.filter(
        (game) => game.ownerId === userId && !publicGames.some((p) => p.id === game.id),
      ),
    ];

    if (!stored && ownerGames.length === 0) {
      return null;
    }

    const socialLinks = resolveDeveloperSocialLinksForDisplay(stored, allOwnerGames);
    const display = resolvePublicProfileDisplay(stored, {
      userId,
      fallbackName:
        ownerGames[0]?.ownerName ?? ownerGames[0]?.creator ?? "開発者",
    });

    const games = ownerGames.map((game) => gameToCreatorCard(game));

    const allDevlogs = ownerGames.flatMap((game) =>
      getDevlogsByProject(game.id),
    );
    allDevlogs.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return {
      routeId,
      creatorId: display.routeId,
      userId,
      name: display.displayName,
      handle: display.handle,
      bio: display.bio,
      avatar: display.avatarSrc,
      // Public surfaces: only explicitly published profile fields (not OAuth-only).
      website: display.website,
      xAccount: display.xAccount,
      discordUrl: socialLinks.discordUrl || undefined,
      youtubeUrl: socialLinks.youtubeUrl || undefined,
      games,
      recentDevlogs: buildRecentDevlogs(ownerGames, allDevlogs),
      stats: {
        gameCount: games.length,
        devlogCount: allDevlogs.length,
      },
    } satisfies CreatorProfileResolved;
  }, [
    getDeveloperProfileByRouteId,
    submittedGames,
    publicGames,
    routeId,
    getDevlogsByProject,
  ]);

  return {
    profile: resolved,
    loaded: dataReady && developerProfilesReady && publicCatalogReady,
  };
}
