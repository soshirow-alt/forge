"use client";

import { useMemo } from "react";
import { useGames } from "@/components/games-provider";
import type { DevlogEntry } from "@/lib/devlogs";
import { resolveDeveloperSocialLinksForDisplay } from "@/lib/developer-external-link-defaults";
import { resolveOwnerUserIdFromRouteId } from "@/lib/developer-profiles";
import { publicBioForDisplay } from "@/lib/public-profile";
import type { Game } from "@/lib/mock-games";
import { pickFeatureTagsFromGameTags } from "@/lib/forge-feature-tag-options";
import { resolveProjectGenres } from "@/lib/project-genres";
import { getPublicGameTags } from "@/lib/play-environment";
import { isGamePublic } from "@/lib/project-visibility";

export type CreatorProfileGameCard = {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  status: "in-dev" | "completed";
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
    inDevelopment: number;
    completed: number;
  };
};

function gameToCreatorCard(game: Game): CreatorProfileGameCard {
  const genres = resolveProjectGenres(game);
  const featureTags = pickFeatureTagsFromGameTags(getPublicGameTags(game.tags));
  const tags = [...genres, ...featureTags];
  return {
    id: game.id,
    title: game.title,
    description: game.description,
    image: game.thumbnailUrl?.trim() || "",
    tags,
    status: game.releaseStatus === "released" ? "completed" : "in-dev",
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
    getDevlogsByProject,
    dataReady,
  } = useGames();

  const resolved = useMemo(() => {
    const stored = getDeveloperProfileByRouteId(routeId);
    const userId =
      stored?.userId ?? resolveOwnerUserIdFromRouteId(routeId) ?? null;

    if (!userId) {
      return null;
    }

    const ownerGames = submittedGames.filter(
      (game) => game.ownerId === userId && isGamePublic(game),
    );
    const allOwnerGames = submittedGames.filter((game) => game.ownerId === userId);

    if (!stored && ownerGames.length === 0) {
      return null;
    }

    const socialLinks = resolveDeveloperSocialLinksForDisplay(stored, allOwnerGames);

    const name =
      stored?.publicName ??
      ownerGames[0]?.ownerName ??
      ownerGames[0]?.creator ??
      "開発者";
    const bio = publicBioForDisplay(stored?.profile);
    const creatorId = stored?.creatorId ?? `dev-${userId}`;
    const handle = creatorId.replace(/^dev-/, "").slice(0, 8);

    const games = ownerGames.map((game) => gameToCreatorCard(game));
    const inDevelopment = games.filter((game) => game.status === "in-dev").length;
    const completed = games.filter((game) => game.status === "completed").length;

    const allDevlogs = ownerGames.flatMap((game) =>
      getDevlogsByProject(game.id),
    );
    allDevlogs.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return {
      routeId,
      creatorId,
      userId,
      name,
      handle,
      bio,
      avatar:
        stored?.avatarUrl?.trim() ||
        ownerGames[0]?.thumbnailUrl?.trim() ||
        "/images/landing/game-1.png",
      website: stored?.website || socialLinks.officialUrl || undefined,
      xAccount: stored?.xAccount || socialLinks.xUrl || undefined,
      discordUrl: socialLinks.discordUrl || undefined,
      youtubeUrl: socialLinks.youtubeUrl || undefined,
      games,
      recentDevlogs: buildRecentDevlogs(ownerGames, allDevlogs),
      stats: {
        inDevelopment,
        completed,
      },
    } satisfies CreatorProfileResolved;
  }, [
    getDeveloperProfileByRouteId,
    submittedGames,
    routeId,
    getDevlogsByProject,
  ]);

  return {
    profile: resolved,
    loaded: dataReady,
  };
}
