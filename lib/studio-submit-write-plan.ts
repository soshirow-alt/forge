/**
 * Pure planner for Studio submit → SubmitFormData (shared by hook + verifies).
 */
import { isSpecifiedPlayAccessType } from "@/lib/play-access-type";
import type { ProjectCategoryId } from "@/lib/project-categories";
import { buildNonGamePublishWriteFields } from "@/lib/project-publish-write-adapter";
import {
  encodePrototypeFieldsToCategoryAttributes,
  mergeCategoryAttributesJson,
  prototypeCategoryToProjectCategory,
} from "@/lib/studio-non-game-attributes";
import { isStudioCommonFieldsOnlyCategory } from "@/lib/studio-category-mode";
import {
  draftToSubmitFormData,
  type SubmitDraftOwner,
  type SubmitDraftState,
} from "@/lib/studio-submit-draft";
import type { SubmitFormData } from "@/lib/project-form";
import type {
  SubmitPrototypeCategory,
  SubmitPrototypeCategoryFields,
} from "@/lib/prototype/studio-submit-flow";

export function planStudioSubmitWrite(input: {
  draft: SubmitDraftState;
  owner: SubmitDraftOwner;
  prototypeCategory?: SubmitPrototypeCategory | null;
  prototypeFields?: SubmitPrototypeCategoryFields | null;
  projectCategory?: ProjectCategoryId | null;
}): SubmitFormData {
  const prototypeCategory = input.prototypeCategory ?? null;
  const prototypeFields = input.prototypeFields ?? null;
  const commonFieldsOnly = isStudioCommonFieldsOnlyCategory(
    input.projectCategory,
  );

  let category: ProjectCategoryId | undefined;
  let categoryAttributes: Record<string, unknown> | undefined;
  let publishOverride:
    | ReturnType<typeof buildNonGamePublishWriteFields>["publishDestinations"]
    | undefined;
  let publishLinkOverride: ReturnType<typeof buildNonGamePublishWriteFields> | undefined;

  if (commonFieldsOnly) {
    category = "asset";
    categoryAttributes = {};
  } else if (prototypeCategory && prototypeFields) {
    category = prototypeCategoryToProjectCategory(prototypeCategory);
    categoryAttributes = mergeCategoryAttributesJson(
      {},
      encodePrototypeFieldsToCategoryAttributes(prototypeFields),
    );
    publishLinkOverride = buildNonGamePublishWriteFields(
      prototypeFields.publishDestinations,
    );
    publishOverride = publishLinkOverride.publishDestinations;
  }

  const data = draftToSubmitFormData(input.draft, input.owner, {
    category,
    categoryAttributes,
    publishDestinationsOverride: publishOverride,
  });

  if (publishLinkOverride) {
    data.playUrl = publishLinkOverride.playUrl;
    data.steamUrl = publishLinkOverride.steamUrl;
    data.itchUrl = publishLinkOverride.itchUrl;
    data.githubUrl = publishLinkOverride.githubUrl;
    data.discordUrl = publishLinkOverride.discordUrl;
    data.officialUrl = publishLinkOverride.officialUrl;
    data.xUrl = publishLinkOverride.xUrl;
    data.youtubeUrl = publishLinkOverride.youtubeUrl;
  }

  if (
    (prototypeCategory || commonFieldsOnly) &&
    !isSpecifiedPlayAccessType(data.playAccessType)
  ) {
    data.playAccessType = "free";
  }

  return data;
}
