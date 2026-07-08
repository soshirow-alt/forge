export type ParsedOgDataUrlImage = {
  contentType: string;
  bytes: Uint8Array;
};

const ALLOWED_OG_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/**
 * Parse a data:image/...;base64,... URL into binary for crawler-facing responses.
 * Returns null for non-image / non-base64 / empty payloads.
 */
export function parseOgDataUrlImage(
  candidate: string | null | undefined,
): ParsedOgDataUrlImage | null {
  const trimmed = candidate?.trim() ?? "";
  if (!trimmed.toLowerCase().startsWith("data:image/")) {
    return null;
  }

  const comma = trimmed.indexOf(",");
  if (comma <= 5) {
    return null;
  }

  const header = trimmed.slice(5, comma); // after "data:"
  const payload = trimmed.slice(comma + 1);
  if (!payload) {
    return null;
  }

  const parts = header.split(";").map((part) => part.trim()).filter(Boolean);
  const mime = parts[0]?.toLowerCase() ?? "";
  if (!ALLOWED_OG_IMAGE_TYPES.has(mime)) {
    return null;
  }

  const isBase64 = parts.some((part) => part.toLowerCase() === "base64");
  if (!isBase64) {
    return null;
  }

  try {
    const binary = Buffer.from(payload, "base64");
    if (binary.length === 0) {
      return null;
    }
    const contentType = mime === "image/jpg" ? "image/jpeg" : mime;
    return { contentType, bytes: new Uint8Array(binary) };
  } catch {
    return null;
  }
}

export function isOgDataUrlImage(candidate: string | null | undefined): boolean {
  return parseOgDataUrlImage(candidate) !== null;
}
