/**
 * Player-facing thumbnail safety: only http(s) URLs leave the wire.
 * data:image and other non-http values must not be listed in discovery/catalog JSON.
 */
export function isHttpOrHttpsUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed);
}

/** Returns the URL only when it is http(s); otherwise null (placeholder path). */
export function safeHttpThumbnailUrl(
  value: string | null | undefined,
): string | null {
  if (!isHttpOrHttpsUrl(value)) return null;
  return value!.trim();
}

export function safeHttpThumbnailUrls(
  urls: Array<string | null | undefined> | null | undefined,
): string[] {
  if (!urls?.length) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const url of urls) {
    const safe = safeHttpThumbnailUrl(url);
    if (!safe || seen.has(safe)) continue;
    seen.add(safe);
    out.push(safe);
  }
  return out;
}
