/**
 * REL-0-00 / REL-0-02 — Forge deployment mode (preview / local / production).
 *
 * Phase 0+ issues branch on `isProductionReleaseMode()` / `shouldHideV0MockContent()`.
 *
 * ## 分岐ルール（再発防止 — 詳細は docs/production-mode-audit.md）
 *
 * - `shouldHideV0MockContent()` で UI コンポーネントを丸ごと差し替えない（データ源差し替え優先）
 * - `isPreviewV0Deployment()` は本ファイル内のみ — 削除・投稿・保存等のボタン非表示に使わない
 * - Preview 確認だけで main/prod GO しない — `NEXT_PUBLIC_FORGE_PRODUCTION_MODE=true` で build 確認
 *
 * CI: `npm run verify:production-mode-guards`
 *
 * | Mode       | Typical host / signal              | Mock UI | Studio login bypass |
 * |------------|------------------------------------|---------|---------------------|
 * | preview    | preview-landing-01 URL, Vercel     | yes     | yes                 |
 * |            | preview slot + preview branch      |         |                     |
 * | local      | localhost / 127.0.0.1              | yes     | yes                 |
 * | production | Production hostname / VERCEL_ENV   | no      | no                  |
 * |            | =production, or force override     |         |                     |
 *
 * Safety: git ref alone never enables preview on a production hostname.
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

function isVercelProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production";
}

function isVercelPreviewDeployment(): boolean {
  return process.env.VERCEL_ENV === "preview";
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

/**
 * Preview / landing-01 deployment surface only.
 * Never true on production hostname or VERCEL_ENV=production — even if git ref is preview/landing-01.
 */
export function isPreviewV0Deployment(host?: string): boolean {
  if (isForceProductionMode()) {
    return false;
  }

  if (isVercelProductionDeployment()) {
    return false;
  }

  const resolved = resolveHost(host);

  if (hostLooksLikePreviewV0(host) || hostLooksLikePreviewV0(resolved)) {
    return true;
  }

  if (isLocalHost(resolved)) {
    return (
      gitRefIsPreviewV0() ||
      process.env.NEXT_PUBLIC_FORGE_PREVIEW_V0 === "true"
    );
  }

  if (isVercelPreviewDeployment()) {
    return (
      gitRefIsPreviewV0() ||
      process.env.NEXT_PUBLIC_FORGE_PREVIEW_V0 === "true"
    );
  }

  return false;
}

export function getForgeDeploymentMode(host?: string): ForgeDeploymentMode {
  if (isForceProductionMode()) {
    return "production";
  }

  if (isVercelProductionDeployment()) {
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

/** @deprecated Root routing is handled in `app/page.tsx` (always LP when logged out). */
export function shouldRedirectRootToDiscoveryHome(_host?: string): boolean {
  return false;
}

/** Preview + local only — Studio login bypass for v0 UI review. Never on production. */
export function shouldBypassStudioLoginGate(host?: string): boolean {
  return !isProductionReleaseMode(host);
}

/** Middleware — routes that require Supabase session in production release mode. */
export function getProductionAuthProtectedPrefixes(): readonly string[] {
  return ["/studio", "/mypage", "/notifications", "/settings"];
}
