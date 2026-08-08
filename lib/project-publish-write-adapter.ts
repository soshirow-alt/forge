/**
 * Single write adapter for project publish destinations → DB columns.
 *
 * All Studio submit/edit paths that persist publish links should go through
 * `buildProjectPublishWriteFields` (or `buildNonGamePublishWriteFields` for
 * prototype labels). Components must not invent legacy URL column mapping.
 *
 * Read compatibility for old rows remains in project-publish-links resolve*.
 */

import { mapPrototypePublishToFormal } from "@/lib/studio-non-game-attributes";
import {
  resolveLinkFieldsForWrite,
  type ProjectLinkFormFields,
} from "@/lib/project-link-write";
import type {
  PublishDestination,
  RelatedLink,
} from "@/lib/project-publish-links";
import type { PrototypePublishDestination } from "@/lib/prototype/studio-submit-flow";

export type ProjectPublishWriteFields = {
  playUrl: string;
  steamUrl?: string;
  itchUrl?: string;
  githubUrl?: string;
  discordUrl?: string;
  officialUrl?: string;
  xUrl?: string;
  youtubeUrl?: string;
  publishDestinations: PublishDestination[];
  relatedLinks: RelatedLink[];
};

/**
 * Form / draft fields → publish_destinations + legacy URL columns.
 * Preferred entry for DB writers (`linkColumnsFromForm`).
 */
export function buildProjectPublishWriteFieldsFromForm(
  data: ProjectLinkFormFields,
): ProjectPublishWriteFields {
  return resolveLinkFieldsForWrite(data);
}

/**
 * Formal destinations (+ related) → publish_destinations + legacy URL fields.
 * Use when destinations are already normalized (validated).
 */
export function buildProjectPublishWriteFields(input: {
  publishDestinations: PublishDestination[];
  relatedLinks?: RelatedLink[];
  /** Used only when destinations yield empty primary (compat). */
  playUrlFallback?: string;
}): ProjectPublishWriteFields {
  return buildProjectPublishWriteFieldsFromForm({
    playUrl: input.playUrlFallback?.trim() ?? "",
    publishDestinations: input.publishDestinations,
    relatedLinks: input.relatedLinks ?? [],
  });
}

/**
 * Validated prototype publish rows → formal destinations + legacy fields.
 * Call only after category kind validation (no unknown→other fallback).
 */
export function buildNonGamePublishWriteFields(
  destinations: PrototypePublishDestination[],
): ProjectPublishWriteFields & {
  /** Copy for category_attributes.nonGamePublishDestinations */
  prototypeDestinations: PrototypePublishDestination[];
} {
  const formal = mapPrototypePublishToFormal(destinations);
  const fields = buildProjectPublishWriteFields({
    publishDestinations: formal,
    relatedLinks: [],
  });
  const prototypeDestinations = destinations
    .filter((item) => item.url.trim())
    .map((item) => ({
      id: item.id,
      kind: item.kind.trim(),
      url: item.url.trim(),
      isPrimary: item.isPrimary === true,
    }));
  return { ...fields, prototypeDestinations };
}

/** Preview / form hydration — same mapping as write, not a second SoT. */
export function previewLegacyLinkFieldsFromPublish(
  publishDestinations: PublishDestination[],
  relatedLinks: RelatedLink[] = [],
): ProjectPublishWriteFields {
  return buildProjectPublishWriteFields({
    publishDestinations,
    relatedLinks,
  });
}
