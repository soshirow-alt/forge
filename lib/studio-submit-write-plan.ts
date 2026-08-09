/**
 * Pure planner for Studio submit → SubmitFormData (shared by hook + verifies).
 */
import { isSpecifiedPlayAccessType } from "@/lib/play-access-type";
import type { ProjectCategoryId } from "@/lib/project-categories";
import { buildNonGamePublishWriteFields } from "@/lib/project-publish-write-adapter";
import {
  ASSET_ATTRIBUTE_KEYS,
  encodeAssetFieldsToCategoryAttributes,
  encodePrototypeFieldsToCategoryAttributes,
  mergeCategoryAttributesJson,
  prototypeCategoryToProjectCategory,
  sanitizeAssetFieldsForSave,
  sanitizeNonGamePrototypeFieldsForSave,
  type SubmitAssetCategoryFields,
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
  /** Asset only — structured kinds/formats/tastes/tools (no game genre/play-info). */
  assetFields?: SubmitAssetCategoryFields | null;
}): SubmitFormData {
  const prototypeCategory = input.prototypeCategory ?? null;
  const prototypeFields = input.prototypeFields ?? null;
  const commonFieldsOnly = isStudioCommonFieldsOnlyCategory(
    input.projectCategory,
  );

  let category: ProjectCategoryId | undefined;
  let categoryAttributes: Record<string, unknown> | undefined;
  let assetKinds: string[] | undefined;
  let publishOverride:
    | ReturnType<typeof buildNonGamePublishWriteFields>["publishDestinations"]
    | undefined;
  let publishLinkOverride: ReturnType<typeof buildNonGamePublishWriteFields> | undefined;

  if (commonFieldsOnly) {
    category = "asset";
    // Create path — no baseline (nothing persisted yet). Callers must run
    // validateSubmitDraftForPost (which performs the same sanitize) first;
    // a throw here means that guard was skipped, not a legitimate reject.
    const sanitizedAssetResult = input.assetFields
      ? sanitizeAssetFieldsForSave(input.assetFields)
      : null;
    if (sanitizedAssetResult && !sanitizedAssetResult.ok) {
      throw new Error(sanitizedAssetResult.message);
    }
    const assetFields = sanitizedAssetResult?.ok
      ? sanitizedAssetResult.fields
      : null;
    categoryAttributes = assetFields
      ? mergeCategoryAttributesJson(
          {},
          encodeAssetFieldsToCategoryAttributes(assetFields),
          ASSET_ATTRIBUTE_KEYS,
        )
      : {};
    assetKinds = assetFields && assetFields.kinds.length > 0 ? assetFields.kinds : undefined;
  } else if (prototypeCategory && prototypeFields) {
    category = prototypeCategoryToProjectCategory(prototypeCategory);
    const sanitizedResult = sanitizeNonGamePrototypeFieldsForSave(
      prototypeCategory,
      prototypeFields,
    );
    if (!sanitizedResult.ok) {
      throw new Error(sanitizedResult.message);
    }
    const sanitizedPrototypeFields = sanitizedResult.fields;
    categoryAttributes = mergeCategoryAttributesJson(
      {},
      encodePrototypeFieldsToCategoryAttributes(sanitizedPrototypeFields),
    );
    publishLinkOverride = buildNonGamePublishWriteFields(
      sanitizedPrototypeFields.publishDestinations,
    );
    publishOverride = publishLinkOverride.publishDestinations;
  }

  const data = draftToSubmitFormData(input.draft, input.owner, {
    category,
    categoryAttributes,
    publishDestinationsOverride: publishOverride,
    assetKinds,
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
