/**
 * Post-login return URL for play / external-link flows only.
 * Whitelist: /games/{id} (+ optional ?play=1 / ?feedback=1) — rejects open redirects.
 */

import { isAllowedGameDetailDemoQuery } from "@/lib/preview-demo-loop";

export const LOGIN_PATH = "/login";

const GAME_DETAIL_PATH = /^\/games\/[a-zA-Z0-9_-]+$/;

export type GameDetailReturnOptions = {
  play?: boolean;
  feedback?: boolean;
};

export function sanitizeLoginReturnUrl(
  value: string | null | undefined,
): string | null {
  if (!value?.trim()) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(value.trim());

    if (!decoded.startsWith("/") || decoded.startsWith("//")) {
      return null;
    }

    if (decoded.includes("#")) {
      return null;
    }

    const [pathname, searchPart] = decoded.split("?", 2);

    if (!GAME_DETAIL_PATH.test(pathname)) {
      return null;
    }

    if (searchPart !== undefined && !isAllowedGameDetailDemoQuery(`?${searchPart}`)) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export function resolvePostLoginPath(
  returnParam: string | null | undefined,
): string {
  return sanitizeLoginReturnUrl(returnParam) ?? "/";
}

export function buildLoginUrlWithReturn(returnPath: string): string {
  const safe = sanitizeLoginReturnUrl(returnPath);
  if (!safe) {
    return LOGIN_PATH;
  }

  return `${LOGIN_PATH}?return=${encodeURIComponent(safe)}`;
}

export function gameDetailReturnPath(
  gameId: string,
  options?: GameDetailReturnOptions,
): string {
  const path = `/games/${gameId}`;
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
