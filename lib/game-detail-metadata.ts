import type { Metadata } from "next";
import { displayPhase } from "@/lib/development-phases";
import {
  DEFAULT_GAME_OG_PATH,
  resolveOgImageUrl,
} from "@/lib/og-image-url";
import { formatPlayableVersionLabel } from "@/lib/playable-version";
import { RELEASE_STATUS_LABELS, type ProjectReleaseStatus } from "@/lib/project-release-state";
import { getSiteOrigin, toAbsoluteUrl } from "@/lib/site-url";
import type { ProjectOgData } from "@/lib/supabase/project-og";

export { DEFAULT_GAME_OG_PATH } from "@/lib/og-image-url";

export const FALLBACK_GAME_METADATA: Metadata = {
  title: "Forge",
  description: "完成前のゲームの最新版・声・更新をまとめる場所",
};

function truncateOneLine(text: string, maxLength = 120): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 1)}…`;
}

function statusLabel(project: ProjectOgData): string | null {
  const release = project.releaseStatus;
  if (release && release in RELEASE_STATUS_LABELS) {
    return RELEASE_STATUS_LABELS[release as ProjectReleaseStatus];
  }
  const phase = project.phase.trim();
  if (!phase) {
    return null;
  }
  return displayPhase(phase);
}

export function buildGameOgDescription(project: ProjectOgData): string {
  const lead =
    truncateOneLine(project.description) ||
    "完成前のゲームを見つけて、声を届けよう";
  const parts = [lead, `最新版 ${formatPlayableVersionLabel(project.playableVersion)}`];
  const status = statusLabel(project);
  if (status) {
    parts.push(status);
  }
  return parts.join(" · ");
}

export function buildGameDetailMetadata(project: ProjectOgData): Metadata {
  const origin = getSiteOrigin();
  const title = `${project.title} | Forge`;
  const description = buildGameOgDescription(project);
  const path = `/games/${project.id}`;
  const pageUrl = toAbsoluteUrl(path, origin);
  const imageUrl = resolveOgImageUrl(project.thumbnailUrl, origin);

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "Forge",
      locale: "ja_JP",
      type: "website",
      images: [
        {
          url: imageUrl,
          alt: project.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export function buildFallbackGameDetailMetadata(): Metadata {
  const origin = getSiteOrigin();
  const imageUrl = resolveOgImageUrl(null, origin);
  const description = FALLBACK_GAME_METADATA.description as string;

  return {
    ...FALLBACK_GAME_METADATA,
    openGraph: {
      title: "Forge",
      description,
      siteName: "Forge",
      locale: "ja_JP",
      type: "website",
      images: [{ url: imageUrl, alt: "Forge" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Forge",
      description,
      images: [imageUrl],
    },
  };
}
