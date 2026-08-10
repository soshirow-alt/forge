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
import { displayPhase } from "@/lib/development-phases";
import { publicProjectThumbnailPath } from "@/lib/public-project-thumbnail";
import {
  normalizeProjectCategory,
  PROJECT_CATEGORY_IDS,
  PROJECT_CATEGORY_SELECTOR_LABELS,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import {
  creatorCapabilityTagLabel,
  isActivityTagId,
} from "@/lib/creator-activity-categories";
import { decodeCategoryAttributesToPrototypeFields } from "@/lib/studio-non-game-attributes";

const NEW_DEVELOPER_MS = 30 * 24 * 60 * 60 * 1000;
const GENRE_SET = new Set<string>(FORGE_GENRE_OPTIONS);

function collectGenres(games: Game[]): string[] {
  const genres = new Set<string>();
  for (const game of games) {
    if (normalizeProjectCategory(game.category) !== "game") continue;
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

function collectActivityCategories(games: Game[]): ProjectCategoryId[] {
  const set = new Set<ProjectCategoryId>();
  for (const game of games) {
    set.add(normalizeProjectCategory(game.category));
  }
  return PROJECT_CATEGORY_IDS.filter((id) => set.has(id));
}

function collectCapabilityTags(
  games: Game[],
  profileActivityTags?: string[] | null,
): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();
  const push = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    tags.push(trimmed);
  };

  for (const raw of profileActivityTags ?? []) {
    if (isActivityTagId(raw)) {
      push(creatorCapabilityTagLabel(raw));
    }
  }

  for (const game of games) {
    const category = normalizeProjectCategory(game.category);
    if (category !== "game") {
      push(PROJECT_CATEGORY_SELECTOR_LABELS[category]);
    }
    const fields = decodeCategoryAttributesToPrototypeFields(
      game.categoryAttributes,
    );
    for (const kind of fields.kinds.slice(0, 2)) {
      push(kind);
    }
    for (const feature of fields.features.slice(0, 1)) {
      push(feature);
    }
    if (category === "audio") {
      for (const mood of fields.moods.slice(0, 1)) push(mood);
    }
  }

  return tags.slice(0, 6);
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
        ownerGames[0]?.ownerName ?? ownerGames[0]?.creator ?? "クリエイター",
    });
    const newestCreated = Math.max(...ownerGames.map(getGameCreatedTimestamp), 0);
    const featuredWorks = ownerGames
      .slice(0, 3)
      .map((game) => ({
        id: game.id,
        title: game.title.trim(),
        image: publicProjectThumbnailPath(game.id),
        phase: displayPhase(game.phase),
      }))
      .filter((work) => work.title.length > 0);

    const activityCategories = collectActivityCategories(ownerGames);
    const capabilityTags = collectCapabilityTags(
      ownerGames,
      profile?.activityTags,
    );

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
      /** @deprecated prefer activityCategories + capabilityTags */
      genres:
        capabilityTags.length > 0
          ? capabilityTags
          : activityCategories.map((id) => PROJECT_CATEGORY_SELECTOR_LABELS[id]),
      activityCategories,
      capabilityTags,
      gameGenres: collectGenres(ownerGames),
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
