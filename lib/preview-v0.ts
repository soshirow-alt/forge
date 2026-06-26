/**
 * Preview v0 helpers — preview/landing-01 branch only.
 * Prod merge 時は / リダイレクト等を見直すこと。
 */

function hostLooksLikePreviewV0(host: string | undefined): boolean {
  return Boolean(host?.includes("preview-landing-01"));
}

export function isPreviewV0Deployment(host?: string): boolean {
  if (hostLooksLikePreviewV0(host)) {
    return true;
  }

  if (typeof window !== "undefined" && hostLooksLikePreviewV0(window.location.hostname)) {
    return true;
  }

  const ref = process.env.VERCEL_GIT_COMMIT_REF;
  if (ref === "preview/landing-01") {
    return true;
  }

  return process.env.NEXT_PUBLIC_FORGE_PREVIEW_V0 === "true";
}

export function shouldRedirectRootToDiscoveryHome(host?: string): boolean {
  return isPreviewV0Deployment(host);
}

/** Preview v0 — Studio 入場・閲覧はログイン不要（mock UI 確認用） */
export function shouldBypassStudioLoginOnPreview(host?: string): boolean {
  return isPreviewV0Deployment(host);
}
