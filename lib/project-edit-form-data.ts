import type { ProjectEditFormData } from "@/lib/project-form";
import { pickFeatureTagsFromGameTags } from "@/lib/forge-feature-tag-options";
import type { Game } from "@/lib/mock-games";
import {
  getPublicGameTags,
  mergePlayEnvironmentIntoTags,
  parsePlayEnvironmentFromTags,
} from "@/lib/play-environment";

export function buildProjectEditFormDataFromGame(game: Game): ProjectEditFormData {
  const featureTags = pickFeatureTagsFromGameTags(getPublicGameTags(game.tags ?? []));
  const playEnvironment = parsePlayEnvironmentFromTags(game.tags ?? []);

  return {
    title: game.title,
    genre: game.genre,
    lookingForTesters: game.lookingForTesters,
    testerSlots: game.testerSlots,
    tags: mergePlayEnvironmentIntoTags(featureTags, playEnvironment),
    thumbnailUrl: game.thumbnailUrl,
    steamUrl: game.steamUrl,
    itchUrl: game.itchUrl,
    githubUrl: game.githubUrl,
    discordUrl: game.discordUrl,
    officialUrl: game.officialUrl,
    xUrl: game.xUrl,
    youtubeUrl: game.youtubeUrl,
    visibility: game.visibility ?? "public",
  };
}
