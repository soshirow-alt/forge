/**
 * Forge entry mode — client-only guest choice (no Supabase Auth).
 *
 * - unset: user has not chosen login vs guest yet (transient; not a product persona)
 * - guest: browsing without account; no user_id; no history merge on login
 */

export const ENTRY_MODE_STORAGE_KEY = "forge-entry-mode";

export type EntryMode = "guest";

export function readEntryMode(): EntryMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(ENTRY_MODE_STORAGE_KEY);
    return value === "guest" ? "guest" : null;
  } catch {
    return null;
  }
}

export function writeEntryModeGuest(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ENTRY_MODE_STORAGE_KEY, "guest");
}

export function clearEntryMode(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ENTRY_MODE_STORAGE_KEY);
}

export function isGuestEntryMode(): boolean {
  return readEntryMode() === "guest";
}

export function isEntryModeUnset(): boolean {
  return readEntryMode() === null;
}

export function shouldShowForgeEntryGate(pathname: string): boolean {
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/login/")
  ) {
    return false;
  }

  if (pathname === "/home" || pathname === "/search" || pathname === "/guide") {
    return true;
  }

  return (
    pathname.startsWith("/search/") ||
    pathname.startsWith("/rankings") ||
    pathname.startsWith("/games/") ||
    pathname.startsWith("/creators/")
  );
}
