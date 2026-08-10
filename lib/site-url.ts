/**
 * Absolute site origin for metadata (OGP / Twitter cards) and transactional email CTAs.
 * Prefer explicit public URL; on Vercel Preview prefer branch alias over ephemeral URL.
 * Never fall back to Production host when running on Preview.
 */
export function getSiteOrigin(): string {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const vercelEnv = process.env.VERCEL_ENV?.trim();
  if (vercelEnv === "preview") {
    const branchUrl = process.env.VERCEL_BRANCH_URL?.trim();
    if (branchUrl) {
      const host = branchUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
      return `https://${host}`;
    }
    const gitRef = process.env.VERCEL_GIT_COMMIT_REF?.trim();
    if (gitRef === "preview/landing-01") {
      return "https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app";
    }
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
