/** Allowed settings surfaces for Player / Studio mode-preserving returns. */
export const PLAYER_SETTINGS_PATH = "/settings" as const;
export const STUDIO_SETTINGS_PATH = "/studio/settings" as const;

export type SettingsSurfacePath =
  | typeof PLAYER_SETTINGS_PATH
  | typeof STUDIO_SETTINGS_PATH;

export function isSettingsSurfacePath(
  path: string | null | undefined,
): path is SettingsSurfacePath {
  if (!path) {
    return false;
  }
  const pathname = path.split("?")[0] ?? path;
  return (
    pathname === PLAYER_SETTINGS_PATH || pathname === STUDIO_SETTINGS_PATH
  );
}

/** Only `/settings` and `/studio/settings` — anything else falls back to Player. */
export function resolveSettingsSurfacePath(
  path: string | null | undefined,
): SettingsSurfacePath {
  if (!path) {
    return PLAYER_SETTINGS_PATH;
  }
  const pathname = path.split("?")[0] ?? path;
  return pathname === STUDIO_SETTINGS_PATH
    ? STUDIO_SETTINGS_PATH
    : PLAYER_SETTINGS_PATH;
}
