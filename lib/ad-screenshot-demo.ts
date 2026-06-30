import { isProductionReleaseMode } from "@/lib/production-mode";
import {
  studioProjectsAll,
  type StudioProjectCard,
} from "@/lib/studio-projects-v0-mock-data";

/**
 * Preview / local の広告スクショ用 — 一時的に mock を厚く見せる。
 * Vercel Preview の Environment Variables のみ:
 *   NEXT_PUBLIC_FORGE_AD_SCREENSHOT_DEMO=true
 * 撮影後は変数を削除するか false に戻す（本番では常に無効）。
 */
export function isAdScreenshotDemoEnabled(host?: string): boolean {
  if (process.env.NEXT_PUBLIC_FORGE_AD_SCREENSHOT_DEMO !== "true") {
    return false;
  }
  return !isProductionReleaseMode(host);
}

/** Studio ホーム・マイページ用 — 新着 FB ありの作品を優先 */
export function adScreenshotStudioProjects(): StudioProjectCard[] {
  const prioritized = ["hoshino-kioku", "seito-no-tabiji", "roshin-no-zanko"];
  const byId = new Map(studioProjectsAll.map((project) => [project.id, project]));
  const picked = prioritized
    .map((id) => byId.get(id))
    .filter((project): project is StudioProjectCard => Boolean(project));
  if (picked.length >= 3) {
    return picked;
  }
  return studioProjectsAll.slice(0, 3);
}
