/**
 * Forge shell mode token helpers (CSS variables live in app/globals.css).
 * Use data-forge-mode="player|studio" on shell roots — do not hardcode Studio hex in pages.
 */

export type ForgeShellMode = "player" | "studio";

export const FORGE_SHELL_BRAND_LABEL: Record<ForgeShellMode, string> = {
  player: "Forge",
  studio: "Forge Studio",
};

/** Player → Studio entry */
export const FORGE_MODE_SWITCH_TO_STUDIO_LABEL = "Studioへ";

/** Studio → Player return */
export const FORGE_MODE_SWITCH_TO_PLAYER_LABEL = "Playerへ戻る";
