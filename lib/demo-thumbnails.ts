export const DEMO_THUMBNAIL_BASE = "/demo-thumbnails";

/** Built-in mock game IDs that have illustrated SVG posters in public/demo-thumbnails/. */
export const BUILT_IN_THUMBNAIL_IDS = [
  "emberfall",
  "neon-drift",
  "hollow-signal",
  "starbound-tactics",
  "iron-covenant",
  "verdant-echo",
  "rift-runner",
  "crimson-vault",
  "skyforge-arena",
  "dust-and-daggers",
  "pulse-circuit",
  "wolfpack-siege",
  "aetherborn",
  "blade-of-ash",
  "quantum-relay",
  "grimhold",
  "lumen-quest",
  "titans-edge",
] as const;

export function getBuiltInThumbnailUrl(gameId: string): string {
  return `${DEMO_THUMBNAIL_BASE}/${gameId}.svg`;
}

export function isBuiltInThumbnailId(gameId: string): boolean {
  return (BUILT_IN_THUMBNAIL_IDS as readonly string[]).includes(gameId);
}
