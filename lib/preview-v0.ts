/**
 * Preview v0 helpers — preview/landing-01 branch only.
 * Prod merge 時は / リダイレクト等を見直すこと。
 */

export function isPreviewV0Deployment(): boolean {
  const ref = process.env.VERCEL_GIT_COMMIT_REF;
  if (ref === "preview/landing-01") {
    return true;
  }
  return process.env.NEXT_PUBLIC_FORGE_PREVIEW_V0 === "true";
}

export function shouldRedirectRootToDiscoveryHome(host?: string): boolean {
  if (host?.includes("preview-landing-01")) {
    return true;
  }
  return isPreviewV0Deployment();
}
