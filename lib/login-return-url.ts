import {
  DEFAULT_POST_GUEST_LOGIN_PATH,
  isGuestReturnPathAllowed,
} from "@/lib/guest-auth";

/**
 * Post-login return URL whitelist — relative paths only, open-redirect safe.
 *
 * Allowed paths:
 * - /home, /search, /search/creators, /guide, /creators/{id}, /rankings/...
 * - /games/{id} (?tab=devlog|voices|overview|special-thanks, ?adoption={id})
 * - /submit, /my-projects, /mypage, /mypage/..., /settings, /bookmarks, /notifications
 * - /studio, /studio/...
 * - /projects/{id}/studio (?devlog=1, ?edit=project|prompts)
 */

export const LOGIN_PATH = "/login";
export const REGISTER_PATH = "/register";

/** Login from a registered-only action — suppress guest entry on /login. */
export const LOGIN_INTENT_REGISTERED = "registered";

export function isRegisteredOnlyLoginIntent(
  intent: string | null | undefined,
): boolean {
  return intent === LOGIN_INTENT_REGISTERED;
}

/** プレイヤー発見・ホーム（return なしログイン/登録・ゲスト参加後と同系統） */
export const DEFAULT_POST_PLAYER_HOME_PATH = "/home";

/** return なしログイン・登録セッション確立後のデフォルト遷移先 */
export const DEFAULT_POST_LOGIN_PATH = DEFAULT_POST_PLAYER_HOME_PATH;

const ID_SEGMENT = `[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}`;
const GAME_TAB_VALUES = new Set(["devlog", "voices", "overview", "special-thanks"]);
const STUDIO_PATH = /^\/studio(?:\/[a-zA-Z0-9][a-zA-Z0-9/_-]*)?$/;
const MYPAGE_PATH = /^\/mypage(?:\/[a-zA-Z0-9][a-zA-Z0-9/_-]*)?$/;
const CREATOR_PROFILE_PATH = new RegExp(`^/creators/(${ID_SEGMENT})$`);
const RANKINGS_PATH = /^\/rankings(?:\/[a-zA-Z0-9][a-zA-Z0-9/_-]*)?$/;
const WORKS_SEARCH_SORT = new Set([
  "recommended",
  "watch",
  "witness",
  "feedback",
  "voices",
]);
const CREATOR_SEARCH_SORT = new Set(["recommended", "followers", "works"]);
const CREATOR_SEARCH_ORDER = new Set(["asc", "desc"]);

function isBoundedParam(value: string | null, maxLength: number): boolean {
  return value !== null && value.length > 0 && value.length <= maxLength;
}

function validateCommaSeparatedFilter(value: string | null, maxLength: number): boolean {
  if (value === null) {
    return true;
  }
  if (value.length > maxLength) {
    return false;
  }
  return value
    .split(",")
    .every((part) => part.trim().length > 0 && part.trim().length <= 64);
}

function validateWorksSearchParams(search: URLSearchParams): boolean {
  for (const key of search.keys()) {
    if (key === "q") {
      if (!isBoundedParam(search.get("q"), 200)) {
        return false;
      }
    } else if (key === "genre" || key === "tag") {
      if (!validateCommaSeparatedFilter(search.get(key), 500)) {
        return false;
      }
    } else if (key === "sort") {
      const sort = search.get("sort");
      if (!sort || !WORKS_SEARCH_SORT.has(sort)) {
        return false;
      }
    } else if (key === "view") {
      const view = search.get("view");
      if (view !== "list" && view !== "grid") {
        return false;
      }
    } else if (key === "page") {
      const page = Number.parseInt(search.get("page") ?? "", 10);
      if (!Number.isFinite(page) || page < 1 || page > 999) {
        return false;
      }
    } else {
      return false;
    }
  }
  return true;
}

function validateCreatorsSearchParams(search: URLSearchParams): boolean {
  for (const key of search.keys()) {
    if (key === "q") {
      if (!isBoundedParam(search.get("q"), 200)) {
        return false;
      }
    } else if (key === "genre") {
      if (!validateCommaSeparatedFilter(search.get("genre"), 500)) {
        return false;
      }
    } else if (key === "sort") {
      const sort = search.get("sort");
      if (!sort || !CREATOR_SEARCH_SORT.has(sort)) {
        return false;
      }
    } else if (key === "order") {
      const order = search.get("order");
      if (!order || !CREATOR_SEARCH_ORDER.has(order)) {
        return false;
      }
    } else if (key === "new") {
      if (search.get("new") !== "1") {
        return false;
      }
    } else {
      return false;
    }
  }
  return true;
}

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
      pathname === "/guide" ||
      pathname === "/submit" ||
      pathname === "/my-projects" ||
      pathname === "/bookmarks" ||
      pathname === "/notifications" ||
      pathname === "/settings"
    ) {
      return search.toString() ? null : pathname;
    }

    if (pathname === "/search") {
      if (!validateWorksSearchParams(search)) {
        return null;
      }
      return buildSanitizedPath(pathname, search);
    }

    if (pathname === "/search/creators") {
      if (!validateCreatorsSearchParams(search)) {
        return null;
      }
      return buildSanitizedPath(pathname, search);
    }

    if (CREATOR_PROFILE_PATH.test(pathname)) {
      return search.toString() ? null : pathname;
    }

    if (RANKINGS_PATH.test(pathname)) {
      return search.toString() ? null : pathname;
    }

    if (MYPAGE_PATH.test(pathname)) {
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

/** Client action return — current route with search string. */
export function buildLocationReturnPath(pathname: string, search: string): string {
  const normalizedSearch = search.startsWith("?") ? search : search ? `?${search}` : "";
  return `${pathname}${normalizedSearch}`;
}

export function buildLoginUrlWithReturn(
  returnPath: string,
  options?: { notice?: string; intent?: typeof LOGIN_INTENT_REGISTERED },
): string {
  const safe = sanitizeLoginReturnUrl(returnPath);
  const params = new URLSearchParams();

  if (safe) {
    params.set("return", safe);
  }

  if (options?.notice) {
    params.set("notice", options.notice);
  }

  if (options?.intent === LOGIN_INTENT_REGISTERED) {
    params.set("intent", LOGIN_INTENT_REGISTERED);
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

export function isGuestEligibleReturnParam(
  returnParam: string | null | undefined,
): boolean {
  const safe = sanitizeLoginReturnUrl(returnParam);
  return Boolean(safe && isGuestReturnPathAllowed(safe));
}

export function shouldShowGuestLoginEntry(
  returnParam: string | null | undefined,
  intentParam: string | null | undefined,
): boolean {
  if (isRegisteredOnlyLoginIntent(intentParam)) {
    return false;
  }
  return isGuestEligibleReturnParam(returnParam);
}
