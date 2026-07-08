import type { Metadata } from "next";
import {
  DEFAULT_GAME_OG_PATH,
  resolveOgImageUrl,
  resolveProjectOgImageUrl,
} from "@/lib/og-image-url";
import { getSiteOrigin, toAbsoluteUrl } from "@/lib/site-url";
import type { ProjectOgData } from "@/lib/supabase/project-og";

export { DEFAULT_GAME_OG_PATH } from "@/lib/og-image-url";

export const FALLBACK_GAME_METADATA: Metadata = {
  title: "Forge",
  description: "完成前のゲームの最新版・声・更新をまとめる場所",
};

const GAME_OG_DESCRIPTION_FALLBACK = "Forgeで公開中の開発中ゲームです。";
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;
const OG_IMAGE_TYPE = "image/jpeg";

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

export function buildGameOgDescription(project: ProjectOgData): string {
  return (
    truncateOneLine(project.description) ||
    truncateOneLine(project.overviewIntroduction) ||
    GAME_OG_DESCRIPTION_FALLBACK
  );
}

export function buildGameDetailMetadata(project: ProjectOgData): Metadata {
  const origin = getSiteOrigin();
  const title = `${project.title} | Forge`;
  const description = buildGameOgDescription(project);
  const path = `/games/${project.id}`;
  const pageUrl = toAbsoluteUrl(path, origin);
  const imageUrl = resolveProjectOgImageUrl(
    project.id,
    project.ogImageUrl,
    origin,
  );
  const usesStorage = Boolean(
    project.ogImageUrl?.trim() && /^https?:\/\//i.test(project.ogImageUrl),
  );

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
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: project.title,
          ...(usesStorage ? { type: OG_IMAGE_TYPE } : {}),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    other: usesStorage
      ? {
          "og:image:width": String(OG_IMAGE_WIDTH),
          "og:image:height": String(OG_IMAGE_HEIGHT),
          "og:image:type": OG_IMAGE_TYPE,
          "og:image:alt": project.title,
        }
      : undefined,
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
      images: [
        {
          url: imageUrl,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: "Forge",
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Forge",
      description,
      images: [imageUrl],
    },
  };
}
