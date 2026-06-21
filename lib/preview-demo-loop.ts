import { isPreviewV0Deployment } from "@/lib/preview-v0";

/** Preview 体験デモの正本ゲーム（星灯の旅路） */
export const DEMO_GAME_ID = "seikat-no-tabiji";

const ALLOWED_DEMO_QUERY_KEYS = new Set(["play", "feedback"]);

export function canPreviewDemoWithoutLogin(): boolean {
  return isPreviewV0Deployment();
}

export function demoGameDetailHref(options?: { play?: boolean; feedback?: boolean }): string {
  const path = `/games/${DEMO_GAME_ID}`;
  const params = new URLSearchParams();
  if (options?.play) {
    params.set("play", "1");
  }
  if (options?.feedback) {
    params.set("feedback", "1");
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function isDemoGameDetailId(id: string): boolean {
  return id === DEMO_GAME_ID;
}

export function isAllowedGameDetailDemoQuery(search: string): boolean {
  if (!search) {
    return true;
  }
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  for (const key of params.keys()) {
    if (!ALLOWED_DEMO_QUERY_KEYS.has(key)) {
      return false;
    }
  }
  if (params.has("play") && params.get("play") !== "1") {
    return false;
  }
  if (params.has("feedback") && params.get("feedback") !== "1") {
    return false;
  }
  return true;
}
