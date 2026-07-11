import type {
  PublishDestination,
  RelatedLink,
} from "@/lib/project-publish-links";
import {
  publishDestinationsForDb,
  relatedLinksForDb,
  resolveGamePublishLinks,
  syncLegacyFieldsFromPublishLinks,
} from "@/lib/project-publish-links";

export type ProjectLinkFormFields = {
  playUrl: string;
  steamUrl?: string;
  itchUrl?: string;
  githubUrl?: string;
  discordUrl?: string;
  officialUrl?: string;
  xUrl?: string;
  youtubeUrl?: string;
  publishDestinations?: PublishDestination[];
  relatedLinks?: RelatedLink[];
};

/**
 * Form / draft から DB 書き込み用の公開先・関連リンクを確定する。
 * publishDestinations がある場合はそれを正本にし、レガシー列へ同期する。
 */
export function resolveLinkFieldsForWrite(data: ProjectLinkFormFields): {
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
} {
  // Explicit structured arrays (including empty) are the source of truth when provided.
  if (data.publishDestinations !== undefined || data.relatedLinks !== undefined) {
    const destinations = publishDestinationsForDb(data.publishDestinations ?? []);
    const related = relatedLinksForDb(data.relatedLinks ?? []);
    const legacy = syncLegacyFieldsFromPublishLinks(destinations, related);
    return {
      ...legacy,
      playUrl: legacy.playUrl || data.playUrl.trim(),
      publishDestinations: destinations,
      relatedLinks: related,
    };
  }

  const derived = resolveGamePublishLinks({
    playUrl: data.playUrl,
    steamUrl: data.steamUrl,
    itchUrl: data.itchUrl,
    githubUrl: data.githubUrl,
    discordUrl: data.discordUrl,
    officialUrl: data.officialUrl,
    xUrl: data.xUrl,
    youtubeUrl: data.youtubeUrl,
  });

  return {
    playUrl: data.playUrl.trim(),
    steamUrl: data.steamUrl,
    itchUrl: data.itchUrl,
    githubUrl: data.githubUrl,
    discordUrl: data.discordUrl,
    officialUrl: data.officialUrl,
    xUrl: data.xUrl,
    youtubeUrl: data.youtubeUrl,
    publishDestinations: derived.publishDestinations,
    relatedLinks: derived.relatedLinks,
  };
}
