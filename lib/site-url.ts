/**
 * Absolute site origin for metadata (OGP / Twitter cards) and transactional email CTAs.
 *
 * Production canonical is https://forgeplace.app.
 * Preview must never emit that host (or legacy Production hosts) — use the
 * current Preview deployment / branch alias origin instead.
 */

export const FORGE_PRODUCTION_SITE_ORIGIN = "https://forgeplace.app";
export const FORGE_LEGACY_PRODUCTION_SITE_ORIGIN =
  "https://forge-flame-gamma.vercel.app";
export const FORGE_PREVIEW_BRANCH_ALIAS_ORIGIN =
  "https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app";

const PRODUCTION_PUBLIC_HOSTS = new Set(["forgeplace.app", "www.forgeplace.app"]);
const LEGACY_PRODUCTION_HOSTS = new Set([
  "forge-flame-gamma.vercel.app",
  "forge-games.net",
  "www.forge-games.net",
]);

function hostnameOf(value: string): string | null {
  try {
    const raw = value.trim();
    if (!raw) return null;
    const url = raw.includes("://") ? new URL(raw) : new URL(`https://${raw}`);
    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isProductionPublicHost(hostOrUrl: string): boolean {
  const host = hostnameOf(hostOrUrl);
  return host ? PRODUCTION_PUBLIC_HOSTS.has(host) : false;
}

export function isLegacyProductionHost(hostOrUrl: string): boolean {
  const host = hostnameOf(hostOrUrl);
  return host ? LEGACY_PRODUCTION_HOSTS.has(host) : false;
}

/** Hosts that must not appear on newly generated Preview CTAs / metadata. */
export function isProductionOrLegacyPublicHost(hostOrUrl: string): boolean {
  return isProductionPublicHost(hostOrUrl) || isLegacyProductionHost(hostOrUrl);
}

function normalizeOrigin(raw: string): string {
  return raw.replace(/\/$/, "");
}

function httpsOriginFromHost(host: string): string {
  return `https://${host.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
}

function previewDeploymentOrigin(): string {
  const branchUrl = process.env.VERCEL_BRANCH_URL?.trim();
  if (branchUrl) {
    return httpsOriginFromHost(branchUrl);
  }
  const gitRef = process.env.VERCEL_GIT_COMMIT_REF?.trim();
  if (gitRef === "preview/landing-01") {
    return FORGE_PREVIEW_BRANCH_ALIAS_ORIGIN;
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return httpsOriginFromHost(vercel);
  }
  return FORGE_PREVIEW_BRANCH_ALIAS_ORIGIN;
}

function explicitConfiguredOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    ""
  );
}

/**
 * Origin used for newly generated public URLs.
 * Preview never falls back to Production / legacy Production hosts even if
 * NEXT_PUBLIC_SITE_URL is mistakenly set to forgeplace.app.
 */
export function getSiteOrigin(): string {
  const vercelEnv = process.env.VERCEL_ENV?.trim();
  const explicit = explicitConfiguredOrigin();
  const explicitNorm = explicit ? normalizeOrigin(explicit) : "";

  if (vercelEnv === "preview") {
    if (explicitNorm && !isProductionOrLegacyPublicHost(explicitNorm)) {
      return explicitNorm;
    }
    return previewDeploymentOrigin();
  }

  if (vercelEnv === "production") {
    return FORGE_PRODUCTION_SITE_ORIGIN;
  }

  if (explicitNorm) {
    return explicitNorm;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return httpsOriginFromHost(vercel);
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
