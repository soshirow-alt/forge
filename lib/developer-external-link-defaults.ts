import type { DeveloperProfile } from "@/lib/developer-profiles";
import type { ExternalLinkFormValues, ProjectExternalLinksInput } from "@/lib/game-links";
import type { Game } from "@/lib/mock-games";
import {
  createEmptyRelatedLink,
  type RelatedLink,
} from "@/lib/project-publish-links";

/** 開発者単位で共通になりやすいリンク（作品ごとのストア URL とは別） */
export const DEVELOPER_SOCIAL_LINK_FIELDS = [
  "discordUrl",
  "xUrl",
  "youtubeUrl",
  "officialUrl",
] as const satisfies ReadonlyArray<keyof ProjectExternalLinksInput>;

export type DeveloperSocialLinkField = (typeof DEVELOPER_SOCIAL_LINK_FIELDS)[number];

function normalizeXUrl(accountOrUrl: string): string {
  const trimmed = accountOrUrl.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://x.com/${trimmed.replace(/^@/, "")}`;
}

function normalizeWebsiteUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

function pickFromRecentProjects(
  projects: Game[],
  field: keyof ProjectExternalLinksInput,
  excludeProjectId?: string,
): string | undefined {
  const sorted = [...projects]
    .filter((project) => project.id !== excludeProjectId)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  for (const project of sorted) {
    const value = project[field]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

export function pickSocialLinkFromProjects(
  projects: Game[],
  field: keyof ProjectExternalLinksInput,
  excludeProjectId?: string,
): string | undefined {
  return pickFromRecentProjects(projects, field, excludeProjectId);
}

/** 開発者プロフィール + 過去作品から、コミュニティ系外部リンクの初期値を推定 */
export function getDeveloperSocialLinkDefaults(
  profile: DeveloperProfile | undefined,
  projects: Game[],
  excludeProjectId?: string,
): Pick<ExternalLinkFormValues, DeveloperSocialLinkField> {
  const xFromProfile = profile?.xAccount
    ? normalizeXUrl(profile.xAccount)
    : undefined;
  const officialFromProfile = profile?.website
    ? normalizeWebsiteUrl(profile.website)
    : undefined;

  return {
    discordUrl:
      profile?.discordUrl?.trim() ||
      pickFromRecentProjects(projects, "discordUrl", excludeProjectId) ||
      "",
    xUrl:
      xFromProfile ??
      pickFromRecentProjects(projects, "xUrl", excludeProjectId) ??
      "",
    youtubeUrl:
      profile?.youtubeUrl?.trim() ||
      pickFromRecentProjects(projects, "youtubeUrl", excludeProjectId) ||
      "",
    officialUrl:
      officialFromProfile ??
      pickFromRecentProjects(projects, "officialUrl", excludeProjectId) ??
      "",
  };
}

export function resolveDeveloperSocialLinksForDisplay(
  profile: DeveloperProfile | undefined,
  projects: Game[],
): Pick<ExternalLinkFormValues, DeveloperSocialLinkField> {
  return getDeveloperSocialLinkDefaults(profile, projects);
}

export function mergeSocialLinkDefaults(
  current: ExternalLinkFormValues,
  defaults: Pick<ExternalLinkFormValues, DeveloperSocialLinkField>,
): ExternalLinkFormValues {
  return {
    ...current,
    discordUrl: current.discordUrl.trim() || defaults.discordUrl,
    xUrl: current.xUrl.trim() || defaults.xUrl,
    youtubeUrl: current.youtubeUrl.trim() || defaults.youtubeUrl,
    officialUrl: current.officialUrl.trim() || defaults.officialUrl,
  };
}

/**
 * 開発者ソーシャル既定値を relatedLinks に変換する（投稿ドラフト初期値用）。
 * Discord / X → other、YouTube → pv_video、公式 → official_site。
 */
export function socialDefaultsToRelatedLinks(
  defaults: Pick<ExternalLinkFormValues, DeveloperSocialLinkField>,
): RelatedLink[] {
  const links: RelatedLink[] = [];

  if (defaults.officialUrl.trim()) {
    links.push(
      createEmptyRelatedLink({
        kind: "official_site",
        url: defaults.officialUrl.trim(),
        label: null,
      }),
    );
  }
  if (defaults.youtubeUrl.trim()) {
    links.push(
      createEmptyRelatedLink({
        kind: "pv_video",
        url: defaults.youtubeUrl.trim(),
        label: null,
      }),
    );
  }
  if (defaults.discordUrl.trim()) {
    links.push(
      createEmptyRelatedLink({
        kind: "other",
        url: defaults.discordUrl.trim(),
        label: "Discord",
      }),
    );
  }
  if (defaults.xUrl.trim()) {
    links.push(
      createEmptyRelatedLink({
        kind: "other",
        url: defaults.xUrl.trim(),
        label: "X",
      }),
    );
  }

  return links;
}

/** 既存 relatedLinks が空のときだけソーシャル既定をマージする */
export function mergeRelatedLinkSocialDefaults(
  current: RelatedLink[],
  defaults: Pick<ExternalLinkFormValues, DeveloperSocialLinkField>,
): RelatedLink[] {
  if (current.some((item) => item.url.trim())) {
    return current;
  }
  return socialDefaultsToRelatedLinks(defaults);
}
