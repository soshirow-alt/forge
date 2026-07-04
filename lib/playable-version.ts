export const DEFAULT_PLAYABLE_VERSION = "0.1";

export function resolvePlayableVersion(value: string | undefined | null): string {
  const trimmed = value?.trim();
  return trimmed || DEFAULT_PLAYABLE_VERSION;
}

/** Display label like `v0.1` (always one leading `v`). */
export function formatPlayableVersionLabel(
  value: string | undefined | null,
): string {
  const resolved = resolvePlayableVersion(value).replace(/^v/i, "");
  return `v${resolved || DEFAULT_PLAYABLE_VERSION}`;
}

export function normalizePlayableVersionInput(input: string): string {
  return input.trim();
}

/** semver-like compare for version_key strings (0.1, 0.2, 1.0) */
export function comparePlayableVersions(a: string, b: string): number {
  const parse = (value: string) =>
    resolvePlayableVersion(value)
      .split(".")
      .map((part) => Number.parseInt(part, 10) || 0);

  const av = parse(a);
  const bv = parse(b);
  const length = Math.max(av.length, bv.length);

  for (let index = 0; index < length; index += 1) {
    const left = av[index] ?? 0;
    const right = bv[index] ?? 0;
    if (left !== right) {
      return left - right;
    }
  }

  return 0;
}

export function isVoiceVersionAtOrBeforePlayable(
  voiceVersionKey: string,
  publishedVersion: string,
): boolean {
  return comparePlayableVersions(voiceVersionKey, publishedVersion) <= 0;
}
