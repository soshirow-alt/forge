import type { ProjectVisibility } from "@/lib/project-visibility";

/**
 * Public insert before thumbnail Storage + og_image_url are ready stamps
 * first_published_at and makes the game crawlable/shareable without a stable
 * og:image. Defer public until HTTPS thumbs are persisted (and OG derive has
 * been attempted).
 */
export function shouldDeferPublicUntilThumbnailsReady(input: {
  intendedVisibility: ProjectVisibility;
  pendingThumbnailCount: number;
}): boolean {
  return (
    input.intendedVisibility === "public" && input.pendingThumbnailCount > 0
  );
}

export function resolveInsertVisibility(input: {
  intendedVisibility: ProjectVisibility;
  pendingThumbnailCount: number;
}): ProjectVisibility {
  return shouldDeferPublicUntilThumbnailsReady(input)
    ? "private"
    : input.intendedVisibility;
}

/** Disable submit while local file→dataURL or publish upload is in flight. */
export function isProjectPublishSubmitDisabled(input: {
  submitting: boolean;
  thumbnailsBusy: boolean;
}): boolean {
  return input.submitting || input.thumbnailsBusy;
}

export function projectPublishSubmitLabel(input: {
  submitting: boolean;
  thumbnailsBusy: boolean;
  hasThumbnails: boolean;
  idleLabel?: string;
}): string {
  if (input.thumbnailsBusy) {
    return "画像を読み込み中…";
  }
  if (input.submitting) {
    return input.hasThumbnails ? "画像をアップロード中…" : "投稿中…";
  }
  return input.idleLabel ?? "投稿する";
}

/**
 * OGP readiness after publish: always have an absolute https candidate.
 * Prefer derived og_image_url; otherwise stable Forge default (never empty).
 * Do not treat gallery thumbnail_url as og:image (product SoT).
 */
export function resolvePublishOgImageCandidate(input: {
  ogImageUrl: string | null | undefined;
  siteOrigin: string;
  defaultOgPath?: string;
}): {
  absoluteOgImage: string;
  usedDefault: boolean;
} {
  const defaultPath = input.defaultOgPath ?? "/images/og-default-v2.png";
  const og = input.ogImageUrl?.trim() ?? "";
  if (/^https:\/\//i.test(og)) {
    return { absoluteOgImage: og, usedDefault: false };
  }
  const origin = input.siteOrigin.replace(/\/$/, "");
  const path = defaultPath.startsWith("/") ? defaultPath : `/${defaultPath}`;
  return { absoluteOgImage: `${origin}${path}`, usedDefault: true };
}
