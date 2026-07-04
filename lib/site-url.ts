/**
 * Absolute site origin for metadata (OGP / Twitter cards).
 * Prefer explicit public URL; fall back to Vercel deployment URL.
 */
export function getSiteOrigin(): string {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}`;
  }

  return "http://localhost:3000";
}

export function toAbsoluteUrl(pathOrUrl: string, origin = getSiteOrigin()): string {
  const trimmed = pathOrUrl.trim();
  if (!trimmed) {
    return origin;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${origin}${path}`;
}
