/**
 * Post-login return URL for play / external-link flows only.
 * Whitelist: /games/{id} — rejects open redirects and non-game paths.
 */

export const LOGIN_PATH = "/login";

const GAME_DETAIL_PATH = /^\/games\/[a-zA-Z0-9_-]+$/;

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

    if (decoded.includes("?") || decoded.includes("#")) {
      return null;
    }

    if (!GAME_DETAIL_PATH.test(decoded)) {
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

export function gameDetailReturnPath(gameId: string): string {
  return `/games/${gameId}`;
}
