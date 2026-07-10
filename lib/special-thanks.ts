/** Platform Special Thanks — shared types and validation (not per-project credits). */

export const SPECIAL_THANKS_PATH = "/special-thanks";
export const SPECIAL_THANKS_ADMIN_PATH = "/admin/special-thanks";

export const SPECIAL_THANKS_PUBLIC_INTRO =
  "Forgeの初期検証・周知に協力いただいた方々です。";

export const SPECIAL_THANKS_DISPLAY_NAME_MAX = 120;
export const SPECIAL_THANKS_HANDLE_MAX = 64;
export const SPECIAL_THANKS_ROLE_LABEL_MAX = 120;
export const SPECIAL_THANKS_NOTE_MAX = 500;
export const SPECIAL_THANKS_URL_MAX = 500;

/** LP footer teaser — keep quiet; not a marketing strip. */
export const SPECIAL_THANKS_LP_TEASER_LIMIT = 6;

export type SpecialThanksEntry = {
  id: string;
  displayName: string;
  handle: string | null;
  roleLabel: string | null;
  url: string | null;
  note: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SpecialThanksEntryInput = {
  displayName: string;
  handle?: string | null;
  roleLabel?: string | null;
  url?: string | null;
  note?: string | null;
  sortOrder?: number;
  isPublished?: boolean;
};

export function normalizeSpecialThanksHandle(
  value: string | null | undefined,
): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim().replace(/^@+/, "");
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, SPECIAL_THANKS_HANDLE_MAX);
}

export function isAllowedSpecialThanksUrl(value: string): boolean {
  if (value.length > SPECIAL_THANKS_URL_MAX) {
    return false;
  }
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeSpecialThanksUrl(
  value: string | null | undefined,
): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (!isAllowedSpecialThanksUrl(trimmed)) {
    throw new Error("url_must_be_http_or_https");
  }
  return trimmed;
}

export function resolveSpecialThanksHref(entry: {
  handle: string | null;
  url: string | null;
}): string | null {
  if (entry.url) {
    return entry.url;
  }
  if (entry.handle) {
    return `https://x.com/${encodeURIComponent(entry.handle)}`;
  }
  return null;
}

export function formatSpecialThanksHandleDisplay(
  handle: string | null | undefined,
): string | null {
  const normalized = normalizeSpecialThanksHandle(handle);
  return normalized ? `@${normalized}` : null;
}

export function validateSpecialThanksInput(
  input: SpecialThanksEntryInput,
): {
  displayName: string;
  handle: string | null;
  roleLabel: string | null;
  url: string | null;
  note: string | null;
  sortOrder: number;
  isPublished: boolean;
} {
  const displayName = input.displayName.trim();
  if (!displayName) {
    throw new Error("display_name_required");
  }
  if (displayName.length > SPECIAL_THANKS_DISPLAY_NAME_MAX) {
    throw new Error("display_name_too_long");
  }

  const handle = normalizeSpecialThanksHandle(input.handle);
  const roleRaw = input.roleLabel?.trim() ?? "";
  const roleLabel = roleRaw
    ? roleRaw.slice(0, SPECIAL_THANKS_ROLE_LABEL_MAX)
    : null;
  const noteRaw = input.note?.trim() ?? "";
  const note = noteRaw ? noteRaw.slice(0, SPECIAL_THANKS_NOTE_MAX) : null;
  const url = normalizeSpecialThanksUrl(input.url);
  const sortOrder =
    typeof input.sortOrder === "number" && Number.isFinite(input.sortOrder)
      ? Math.trunc(input.sortOrder)
      : 0;
  const isPublished = Boolean(input.isPublished);

  return {
    displayName,
    handle,
    roleLabel,
    url,
    note,
    sortOrder,
    isPublished,
  };
}
