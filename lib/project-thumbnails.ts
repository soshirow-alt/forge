export const MAX_PROJECT_THUMBNAILS = 10;
export const RECOMMENDED_PROJECT_THUMBNAILS = 3;

export function sanitizeProjectThumbnailUrls(urls: string[] | undefined): string[] {
  if (!urls?.length) {
    return [];
  }

  const seen = new Set<string>();
  const sanitized: string[] = [];

  for (const url of urls) {
    const trimmed = url.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    sanitized.push(trimmed);
    if (sanitized.length >= MAX_PROJECT_THUMBNAILS) {
      break;
    }
  }

  return sanitized;
}

export function resolveProjectThumbnailUrlsFromRow(row: {
  thumbnail_urls?: string[] | null;
  thumbnail_url?: string | null;
}): string[] {
  const fromArray = sanitizeProjectThumbnailUrls(row.thumbnail_urls ?? undefined);
  if (fromArray.length > 0) {
    return fromArray;
  }

  const legacy = row.thumbnail_url?.trim();
  return legacy ? [legacy] : [];
}

export function resolveProjectPrimaryThumbnail(row: {
  thumbnail_urls?: string[] | null;
  thumbnail_url?: string | null;
}): string | undefined {
  return resolveProjectThumbnailUrlsFromRow(row)[0];
}

export function resolveProjectThumbnailUrls(game: {
  thumbnailUrls?: string[];
  thumbnailUrl?: string;
}): string[] {
  const fromArray = sanitizeProjectThumbnailUrls(game.thumbnailUrls);
  if (fromArray.length > 0) {
    return fromArray;
  }

  const legacy = game.thumbnailUrl?.trim();
  return legacy ? [legacy] : [];
}

export type ProjectThumbnailDbFields = {
  thumbnail_url: string | null;
  thumbnail_urls: string[];
};

export function projectThumbnailsForDb(
  thumbnailUrls: string[] | undefined,
): ProjectThumbnailDbFields {
  const sanitized = sanitizeProjectThumbnailUrls(thumbnailUrls);
  return {
    thumbnail_urls: sanitized,
    thumbnail_url: sanitized[0] ?? null,
  };
}

function thumbnailListsEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((url, index) => url === b[index]);
}

/**
 * Studio/submit updates: omit thumbnail columns when unchanged, and never
 * replace existing thumbs with null/[] unless allowClear is set (images panel).
 */
export function projectThumbnailsForDbUpdate(
  incomingUrls: string[] | undefined,
  existing: {
    thumbnail_url?: string | null;
    thumbnail_urls?: string[] | null;
  },
  options?: { allowClear?: boolean },
): ProjectThumbnailDbFields | null {
  const sanitized = sanitizeProjectThumbnailUrls(incomingUrls);
  const existingUrls = resolveProjectThumbnailUrlsFromRow(existing);

  if (sanitized.length === 0) {
    if (existingUrls.length > 0 && !options?.allowClear) {
      return null;
    }
    return { thumbnail_url: null, thumbnail_urls: [] };
  }

  if (thumbnailListsEqual(sanitized, existingUrls)) {
    return null;
  }

  return {
    thumbnail_urls: sanitized,
    thumbnail_url: sanitized[0] ?? null,
  };
}

export function canAddProjectThumbnails(currentCount: number, adding = 1): boolean {
  return currentCount + adding <= MAX_PROJECT_THUMBNAILS;
}
