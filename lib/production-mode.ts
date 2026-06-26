/**
 * REL-0-00 — Forge deployment mode (preview / local / production).
 *
 * Phase 0+ issues branch on `isProductionReleaseMode()` / `shouldHideV0MockContent()`.
 *
 * | Mode       | Typical host / signal              | Mock UI | Studio login bypass |
 * |------------|------------------------------------|---------|---------------------|
 * | preview    | preview-landing-01 URL, git ref,   | yes     | yes                 |
 * |            | NEXT_PUBLIC_FORGE_PREVIEW_V0=true  |         |                     |
 * | local      | localhost / 127.0.0.1              | yes     | yes                 |
 * | production | Other deployed hosts               | no      | no                  |
 *
 * Override (E2E / prod-behavior testing on preview or local):
 *   NEXT_PUBLIC_FORGE_PRODUCTION_MODE=true
 *   FORGE_PRODUCTION_MODE=true (server-only)
 */

export type ForgeDeploymentMode = "preview" | "local" | "production";

function hostLooksLikePreviewV0(host: string | undefined): boolean {
  return Boolean(host?.includes("preview-landing-01"));
}

function gitRefIsPreviewV0(): boolean {
  const refs = [
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF,
    process.env.VERCEL_GIT_COMMIT_REF,
  ];
  return refs.some((ref) => ref === "preview/landing-01");
}

function isForceProductionMode(): boolean {
  return (
    process.env.NEXT_PUBLIC_FORGE_PRODUCTION_MODE === "true" ||
    process.env.FORGE_PRODUCTION_MODE === "true"
  );
}

function resolveHost(host?: string): string | undefined {
  if (host) {
    return host;
  }
  if (typeof window !== "undefined") {
    return window.location.hostname;
  }
  return undefined;
}

function isLocalHost(host: string | undefined): boolean {
  if (!host) {
    return false;
  }

  const normalized = host.toLowerCase().split(":")[0] ?? host;
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "[::1]" ||
    normalized.endsWith(".localhost")
  );
}

/** Preview / landing-01 deployment (Vercel preview, git ref, or explicit env). */
export function isPreviewV0Deployment(host?: string): boolean {
  if (isForceProductionMode()) {
    return false;
  }

  if (hostLooksLikePreviewV0(host)) {
    return true;
  }

  if (hostLooksLikePreviewV0(resolveHost())) {
    return true;
  }

  if (gitRefIsPreviewV0()) {
    return true;
  }

  return process.env.NEXT_PUBLIC_FORGE_PREVIEW_V0 === "true";
}

export function getForgeDeploymentMode(host?: string): ForgeDeploymentMode {
  if (isForceProductionMode()) {
    return "production";
  }

  if (isPreviewV0Deployment(host)) {
    return "preview";
  }

  if (isLocalHost(resolveHost(host))) {
    return "local";
  }

  return "production";
}

/** True on production hosts — mock catalog, stubs, and preview bypass must be off. */
export function isProductionReleaseMode(host?: string): boolean {
  return getForgeDeploymentMode(host) === "production";
}

/** Phase 0+ — skip merging mock games, mock FB lists, fake notifications, etc. */
export function shouldHideV0MockContent(host?: string): boolean {
  return isProductionReleaseMode(host);
}

/** Preview-only: `/` → `/home` (middleware). Local keeps default `/` behavior. */
export function shouldRedirectRootToDiscoveryHome(host?: string): boolean {
  return isPreviewV0Deployment(host);
}

/** Preview + local: Studio login / onboarding gate bypass for v0 UI review. */
export function shouldBypassStudioLoginGate(host?: string): boolean {
  return !isProductionReleaseMode(host);
}
