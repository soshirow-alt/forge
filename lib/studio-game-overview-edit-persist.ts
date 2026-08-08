/**
 * Pure planners for game Studio overview edit → ProjectEditFormData.
 * Panels and E2E verifies share these so tag compose cannot drift from UI save.
 */
import type { Game } from "@/lib/mock-games";
import type { ProjectEditFormData } from "@/lib/project-form";
import { buildProjectEditFormDataFromGame } from "@/lib/project-edit-form-data";
import {
  sanitizeFeatureTagsForSave,
  type ForgeFeatureTagOption,
} from "@/lib/forge-feature-tag-options";
import { sanitizeProjectGenresForSave } from "@/lib/project-genres";
import type { ForgeGenreOption } from "@/lib/forge-genre-options";
import {
  parsePlayEnvironmentFromTags,
  type PlayEnvironmentFormState,
} from "@/lib/play-environment";
import {
  composeProjectTagsForWrite,
  extractFeatureTagsFromProjectTags,
} from "@/lib/project-tags";
import { previewLegacyLinkFieldsFromPublish } from "@/lib/project-publish-write-adapter";
import {
  distributionTypeFromPrimary,
  type PublishDestination,
  type RelatedLink,
} from "@/lib/project-publish-links";
import type { ProjectVisibility } from "@/lib/project-visibility";
import type { AgeRating } from "@/lib/age-rating";
import type { SubmitPlayAccessType } from "@/lib/play-access-type";

export function buildGameGenresTagsEditPersistPayload(
  game: Game,
  input: {
    genres: ForgeGenreOption[];
    featureTags: ForgeFeatureTagOption[];
    ageRating: AgeRating;
  },
): ProjectEditFormData {
  const playEnvironment = parsePlayEnvironmentFromTags(game.tags ?? []);
  return {
    ...buildProjectEditFormDataFromGame(game),
    genres: sanitizeProjectGenresForSave(input.genres),
    tags: composeProjectTagsForWrite({
      featureTags: sanitizeFeatureTagsForSave(input.featureTags),
      playEnvironment,
      existingTags: game.tags,
    }),
    ageRating: input.ageRating,
  };
}

export function buildGamePlayInfoEditPersistPayload(
  game: Game,
  input: {
    playAccessType: SubmitPlayAccessType;
    estimatedPlayTime: string;
    playEnvironment: PlayEnvironmentFormState;
    featureTags: ForgeFeatureTagOption[];
  },
): ProjectEditFormData {
  const base = buildProjectEditFormDataFromGame(game);
  return {
    ...base,
    playUrl: base.playUrl,
    publishDestinations: base.publishDestinations,
    relatedLinks: base.relatedLinks,
    steamUrl: base.steamUrl,
    itchUrl: base.itchUrl,
    githubUrl: base.githubUrl,
    discordUrl: base.discordUrl,
    officialUrl: base.officialUrl,
    xUrl: base.xUrl,
    youtubeUrl: base.youtubeUrl,
    estimatedPlayTime: input.estimatedPlayTime || undefined,
    playAccessType: input.playAccessType,
    tags: composeProjectTagsForWrite({
      featureTags: sanitizeFeatureTagsForSave(input.featureTags),
      playEnvironment: input.playEnvironment,
      existingTags: game.tags,
    }),
  };
}

export function buildGamePublicationEditPersistPayload(
  game: Game,
  input: {
    visibility: ProjectVisibility;
    publishDestinations: PublishDestination[];
    relatedLinks: RelatedLink[];
  },
): ProjectEditFormData {
  const base = buildProjectEditFormDataFromGame(game);
  const legacy = previewLegacyLinkFieldsFromPublish(
    input.publishDestinations,
    input.relatedLinks,
  );
  const featureTags = extractFeatureTagsFromProjectTags(game.tags);
  const playEnvironment = parsePlayEnvironmentFromTags(game.tags ?? []);
  const distribution = distributionTypeFromPrimary(input.publishDestinations);
  return {
    ...base,
    visibility: input.visibility,
    publishDestinations: input.publishDestinations,
    relatedLinks: input.relatedLinks,
    playUrl: legacy.playUrl,
    steamUrl: legacy.steamUrl,
    itchUrl: legacy.itchUrl,
    githubUrl: legacy.githubUrl,
    discordUrl: legacy.discordUrl,
    officialUrl: legacy.officialUrl,
    xUrl: legacy.xUrl,
    youtubeUrl: legacy.youtubeUrl,
    tags: composeProjectTagsForWrite({
      featureTags,
      playEnvironment: {
        ...playEnvironment,
        distribution: distribution || playEnvironment.distribution,
      },
      existingTags: game.tags,
    }),
  };
}
