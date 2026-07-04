import { gamePlayHref } from "@/lib/project-nurture-links";

/** Client-side absolute URL for the public project page (current origin). */
export function getClientProjectPageUrl(projectId: string): string {
  const path = gamePlayHref(projectId);
  if (typeof window === "undefined") {
    return path;
  }
  return `${window.location.origin}${path}`;
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

/** X Web Intent — opens compose UI; does not post automatically. */
export function buildXComposeIntentUrl(text: string): string {
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export function openXComposeInNewTab(text: string): void {
  const url = buildXComposeIntentUrl(text);
  window.open(url, "_blank", "noopener,noreferrer");
}
