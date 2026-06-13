export const DEFAULT_PLAYABLE_VERSION = "0.1";

export function resolvePlayableVersion(value: string | undefined | null): string {
  const trimmed = value?.trim();
  return trimmed || DEFAULT_PLAYABLE_VERSION;
}

export function normalizePlayableVersionInput(input: string): string {
  return input.trim();
}
