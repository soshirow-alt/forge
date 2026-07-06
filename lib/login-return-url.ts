import {
  DEFAULT_POST_GUEST_LOGIN_PATH,
  isGuestReturnPathAllowed,
} from "@/lib/guest-auth";

/**
 * Post-login return URL whitelist — relative paths only, open-redirect safe.
 *
 * Allowed paths:
 * - /games/{id} (?tab=devlog|voices|overview, ?adoption={id})
 * - /submit, /my-projects
 * - /studio, /studio/...
 * - /projects/{id}/studio (?devlog=1, ?edit=project|prompts)
 */

export const LOGIN_PATH = "/login";
export const REGISTER_PATH = "/register";

/** return なしログイン・登録セッション確立後のデフォルト遷移先（開発者マイページ） */
export const DEFAULT_POST_LOGIN_PATH = "/studio/mypage";

/** プレイヤー発見・ホーム（ゲスト参加後と同系統） */
export const DEFAULT_POST_PLAYER_HOME_PATH = "/home";

const ID_SEGMENT = `[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}`;
const GAME_TAB_VALUES = new Set(["devlog", "voices", "overview"]);
const STUDIO_PATH = /^\/studio(?:\/[a-zA-Z0-9][a-zA-Z0-9/_-]*)?$/;

function isUnsafeRelativePath(value: string): boolean {
  return (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("://") ||
    value.includes("\\") ||
    value.includes("@")
  );
}

function validateGameSearchParams(search: URLSearchParams): boolean {
  for (const key of search.keys()) {
    if (key === "tab") {
      const tab = search.get("tab");
      if (!tab || !GAME_TAB_VALUES.has(tab)) {
        return false;
      }
    } else if (key === "adoption") {
      const adoption = search.get("adoption");
      if (!adoption || !/^[\w-]{1,128}$/.test(adoption)) {
        return false;
      }
    } else {
      return false;
    }
  }
  return true;
}

function validateStudioSearchParams(search: URLSearchParams): boolean {
  for (const key of search.keys()) {
    if (key === "submit") {
      if (search.get("submit") !== "1") {
        return false;
      }
    } else if (key === "q") {
      const q = search.get("q");
      if (!q || q.length > 200) {
        return false;
      }
    } else if (key === "edit") {
      const edit = search.get("edit");
      if (edit !== "project" && edit !== "prompts") {
        return false;
      }
    } else if (key === "devlog") {
      if (search.get("devlog") !== "1") {
        return false;
      }
    } else {
      return false;
    }
  }
  return true;
}

function buildSanitizedPath(pathname: string, search: URLSearchParams): string {
  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function sanitizeLoginReturnUrl(
  value: string | null | undefined,
): string | null {
  if (!value?.trim()) {
    return null;
  }

  try {
    let decoded = decodeURIComponent(value.trim());
    const hashIndex = decoded.indexOf("#");
    if (hashIndex >= 0) {
      decoded = decoded.slice(0, hashIndex);
    }

    if (isUnsafeRelativePath(decoded)) {
      return null;
    }

    const queryIndex = decoded.indexOf("?");
    const pathname =
      queryIndex >= 0 ? decoded.slice(0, queryIndex) : decoded;
    const search =
      queryIndex >= 0
        ? new URLSearchParams(decoded.slice(queryIndex + 1))
        : new URLSearchParams();

    if (
      pathname === "/home" ||
      pathname === "/submit" ||
      pathname === "/my-projects" ||
      pathname === "/bookmarks" ||
      pathname === "/notifications"
    ) {
      return search.toString() ? null : pathname;
    }

    const gameMatch = pathname.match(new RegExp(`^/games/(${ID_SEGMENT})$`));
    if (gameMatch) {
      if (!validateGameSearchParams(search)) {
        return null;
      }
      return buildSanitizedPath(pathname, search);
    }

    if (STUDIO_PATH.test(pathname)) {
      if (!validateStudioSearchParams(search)) {
        return null;
      }
      return buildSanitizedPath(pathname, search);
    }

    const projectStudioMatch = pathname.match(
      new RegExp(`^/projects/(${ID_SEGMENT})/studio$`),
    );
    if (projectStudioMatch) {
      if (!validateStudioSearchParams(search)) {
        return null;
      }
      return buildSanitizedPath(pathname, search);
    }

    return null;
  } catch {
    return null;
  }
}

export function resolvePostLoginPath(
  returnParam: string | null | undefined,
): string {
  return resolvePostAuthPath(returnParam, { isGuest: false });
}

export function resolvePostGuestLoginPath(
  returnParam: string | null | undefined,
): string {
  return resolvePostAuthPath(returnParam, { isGuest: true });
}

export function resolvePostAuthPath(
  returnParam: string | null | undefined,
  options: { isGuest: boolean },
): string {
  const sanitized = sanitizeLoginReturnUrl(returnParam);

  if (options.isGuest) {
    if (sanitized && isGuestReturnPathAllowed(sanitized)) {
      return sanitized;
    }
    return DEFAULT_POST_GUEST_LOGIN_PATH;
  }

  return sanitized ?? DEFAULT_POST_LOGIN_PATH;
}

export function buildPathWithSearch(pathname: string, searchParams: string): string {
  return searchParams ? `${pathname}?${searchParams}` : pathname;
}

export function buildLoginUrlWithReturn(
  returnPath: string,
  options?: { notice?: string },
): string {
  const safe = sanitizeLoginReturnUrl(returnPath);
  const params = new URLSearchParams();

  if (safe) {
    params.set("return", safe);
  }

  if (options?.notice) {
    params.set("notice", options.notice);
  }

  const query = params.toString();
  return query ? `${LOGIN_PATH}?${query}` : LOGIN_PATH;
}

export function buildRegisterUrlWithReturn(returnPath: string): string {
  const safe = sanitizeLoginReturnUrl(returnPath);
  if (!safe) {
    return REGISTER_PATH;
  }

  const params = new URLSearchParams({ return: safe });
  return `${REGISTER_PATH}?${params.toString()}`;
}

export function gameDetailReturnPath(gameId: string): string {
  return `/games/${gameId}`;
}
