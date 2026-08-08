import type { ProjectEditFormData } from "@/lib/project-form";
import { pickFeatureTagsFromGameTags, sanitizeFeatureTagsForSave } from "@/lib/forge-feature-tag-options";
import { isSpecifiedPlayAccessType } from "@/lib/play-access-type";
import {
  pickForgeGenresFromList,
  resolveProjectGenres,
  sanitizeProjectGenresForSave,
} from "@/lib/project-genres";
import type { Game } from "@/lib/mock-games";
import {
  getPublicGameTags,
  mergePlayEnvironmentIntoTags,
  parsePlayEnvironmentFromTags,
} from "@/lib/play-environment";
import { loadGameExtras } from "@/lib/game-extra-storage";
import { resolveProjectThumbnailUrls } from "@/lib/project-thumbnails";
import {
  resolveGamePublishLinks,
  syncLegacyFieldsFromPublishLinks,
} from "@/lib/project-publish-links";
import { normalizeAgeRating } from "@/lib/age-rating";

export function buildProjectEditFormDataFromGame(game: Game): ProjectEditFormData {
  const featureTags = sanitizeFeatureTagsForSave(
    pickFeatureTagsFromGameTags(getPublicGameTags(game.tags ?? [])),
  );
  const playEnvironment = parsePlayEnvironmentFromTags(game.tags ?? []);
  const legacyExtra =
    typeof window !== "undefined" ? loadGameExtras()[game.id] : undefined;
  const links = resolveGamePublishLinks(game);
  const legacy = syncLegacyFieldsFromPublishLinks(
    links.publishDestinations,
    links.relatedLinks,
  );

  return {
    title: game.title,
    description: game.description,
    genres: sanitizeProjectGenresForSave(
      pickForgeGenresFromList(resolveProjectGenres(game)),
    ),
    phase: game.phase,
    playUrl: legacy.playUrl || game.playUrl,
    estimatedPlayTime: game.estimatedPlayTime ?? legacyExtra?.estimatedPlayTime,
    lookingForTesters: game.lookingForTesters,
    testerSlots: game.testerSlots,
    tags: mergePlayEnvironmentIntoTags(featureTags, playEnvironment),
    thumbnailUrls: resolveProjectThumbnailUrls(game),
    steamUrl: legacy.steamUrl ?? game.steamUrl,
    itchUrl: legacy.itchUrl ?? game.itchUrl,
    githubUrl: legacy.githubUrl ?? game.githubUrl,
    discordUrl: legacy.discordUrl ?? game.discordUrl,
    officialUrl: legacy.officialUrl ?? game.officialUrl,
    xUrl: legacy.xUrl ?? game.xUrl,
    youtubeUrl: legacy.youtubeUrl ?? game.youtubeUrl,
    publishDestinations: links.publishDestinations,
    relatedLinks: links.relatedLinks,
    visibility: game.visibility ?? "public",
    ageRating: normalizeAgeRating(game.ageRating),
    ...(isSpecifiedPlayAccessType(game.playAccessType)
      ? { playAccessType: game.playAccessType }
      : {}),
    ...(game.category ? { category: game.category } : {}),
    ...(game.categoryAttributes !== undefined
      ? {
          categoryAttributes:
            game.categoryAttributes &&
            typeof game.categoryAttributes === "object" &&
            !Array.isArray(game.categoryAttributes)
              ? { ...(game.categoryAttributes as Record<string, unknown>) }
              : {},
        }
      : {}),
  };
}
