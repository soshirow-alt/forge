import type { Metadata } from "next";
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_MIME,
  OG_IMAGE_WIDTH,
} from "@/lib/og-image-constants";
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

function isDefaultOgImageUrl(imageUrl: string, origin: string): boolean {
  const fallback = resolveOgImageUrl(null, origin);
  return (
    imageUrl === fallback ||
    imageUrl.endsWith(DEFAULT_GAME_OG_PATH) ||
    imageUrl.includes("/images/og-default-v2.png")
  );
}

/** Default PNG and derived OGP JPEG both publish explicit 1200×630 metadata. */
function buildGameOgImage(
  imageUrl: string,
  alt: string,
  options: { isDefault: boolean; contentType?: string },
) {
  if (options.isDefault) {
    return {
      url: imageUrl,
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      type: "image/png" as const,
      alt,
    };
  }
  return {
    url: imageUrl,
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    type: (options.contentType || OG_IMAGE_MIME) as "image/jpeg" | "image/png",
    alt,
  };
}

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
  const isDefault = isDefaultOgImageUrl(imageUrl, origin);
  const contentType = isDefault
    ? "image/png"
    : imageUrl.toLowerCase().endsWith(".png")
      ? "image/png"
      : OG_IMAGE_MIME;
  const ogImage = buildGameOgImage(imageUrl, project.title, {
    isDefault,
    contentType,
  });

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
      images: [ogImage],
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
  const ogImage = buildGameOgImage(imageUrl, "Forge", { isDefault: true });

  return {
    ...FALLBACK_GAME_METADATA,
    openGraph: {
      title: "Forge",
      description,
      siteName: "Forge",
      locale: "ja_JP",
      type: "website",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: "Forge",
      description,
      images: [imageUrl],
    },
  };
}
