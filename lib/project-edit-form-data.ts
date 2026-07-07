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

export function buildProjectEditFormDataFromGame(game: Game): ProjectEditFormData {
  const featureTags = sanitizeFeatureTagsForSave(
    pickFeatureTagsFromGameTags(getPublicGameTags(game.tags ?? [])),
  );
  const playEnvironment = parsePlayEnvironmentFromTags(game.tags ?? []);
  const legacyExtra =
    typeof window !== "undefined" ? loadGameExtras()[game.id] : undefined;

  return {
    title: game.title,
    description: game.description,
    genres: sanitizeProjectGenresForSave(
      pickForgeGenresFromList(resolveProjectGenres(game)),
    ),
    phase: game.phase,
    playUrl: game.playUrl,
    estimatedPlayTime: game.estimatedPlayTime ?? legacyExtra?.estimatedPlayTime,
    lookingForTesters: game.lookingForTesters,
    testerSlots: game.testerSlots,
    tags: mergePlayEnvironmentIntoTags(featureTags, playEnvironment),
    thumbnailUrls: resolveProjectThumbnailUrls(game),
    steamUrl: game.steamUrl,
    itchUrl: game.itchUrl,
    githubUrl: game.githubUrl,
    discordUrl: game.discordUrl,
    officialUrl: game.officialUrl,
    xUrl: game.xUrl,
    youtubeUrl: game.youtubeUrl,
    visibility: game.visibility ?? "public",
    ...(isSpecifiedPlayAccessType(game.playAccessType)
      ? { playAccessType: game.playAccessType }
      : {}),
  };
}
