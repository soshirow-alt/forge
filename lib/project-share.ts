import { FORGE_PRODUCTION_OAUTH_ORIGIN } from "@/lib/auth-redirect";
import {
  projectOgImageApiPath,
  projectOgSyncApiPath,
} from "@/lib/og-image-url";
import { gamePlayHref } from "@/lib/project-nurture-links";

/**
 * Absolute URL for external share (X / clipboard).
 * Always production origin — never Preview / localhost host —
 * so cards and pasted links resolve where Twitterbot can cache.
 */
export function getClientProjectPageUrl(projectId: string): string {
  const path = gamePlayHref(projectId);
  return `${FORGE_PRODUCTION_OAUTH_ORIGIN}${path}`;
}

/** Fire-and-forget GET to warm Storage OGP card before the user pastes to X. */
export function prewarmProjectOgCard(projectId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const origin = window.location.origin;
    void fetch(`${origin}${projectOgSyncApiPath(projectId)}`, {
      method: "GET",
      credentials: "omit",
      keepalive: true,
    }).catch(() => {});
    void fetch(`${origin}${projectOgImageApiPath(projectId)}`, {
      method: "GET",
      credentials: "omit",
      mode: "no-cors",
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

export function buildProjectShareIntroText(
  title: string,
  pageUrl: string,
): string {
  const displayTitle = title.trim() || "作品";
  return [
    "開発中のゲームをForgeに投稿しました。",
    "",
    "遊んでみて、感想や気になったところをもらえると嬉しいです。",
    "",
    `『${displayTitle}』`,
    pageUrl,
  ].join("\n");
}

/** X Web Intent body — URL appears once in `text` only (no `url` param). */
export function buildXComposeShareText(title: string, pageUrl: string): string {
  return buildProjectShareIntroText(title, pageUrl);
}

/** X Web Intent — opens compose UI; does not post automatically. */
export function buildXComposeIntentUrl(text: string): string {
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export function openXComposeInNewTab(title: string, pageUrl: string): void {
  const text = buildXComposeShareText(title, pageUrl);
  const url = buildXComposeIntentUrl(text);
  window.open(url, "_blank", "noopener,noreferrer");
}
