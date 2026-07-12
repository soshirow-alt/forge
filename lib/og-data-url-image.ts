import { MAX_PUBLIC_PROJECT_THUMBNAIL_BYTES } from "@/lib/public-project-thumbnail";

export type ParsedOgDataUrlImage = {
  contentType: string;
  bytes: Uint8Array;
};

export const MAX_OG_DATA_URL_IMAGE_BYTES =
  MAX_PUBLIC_PROJECT_THUMBNAIL_BYTES;

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
  maxDecodedBytes = MAX_OG_DATA_URL_IMAGE_BYTES,
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

  const normalizedPayload = payload.replace(/\s+/g, "");
  if (
    maxDecodedBytes <= 0 ||
    normalizedPayload.length === 0 ||
    normalizedPayload.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(normalizedPayload)
  ) {
    return null;
  }

  const padding = normalizedPayload.endsWith("==")
    ? 2
    : normalizedPayload.endsWith("=")
      ? 1
      : 0;
  const estimatedBytes = (normalizedPayload.length / 4) * 3 - padding;
  if (estimatedBytes > maxDecodedBytes) {
    return null;
  }

  try {
    const binary = Buffer.from(normalizedPayload, "base64");
    if (binary.length === 0 || binary.length > maxDecodedBytes) {
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
