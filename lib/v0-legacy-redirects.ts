/**
 * 旧UIルート → v0 正本へのリダイレクト（Preview v0 全面化）
 */
export const V0_LEGACY_REDIRECTS: Readonly<Record<string, string>> = {
  "/bookmarks": "/mypage?tab=saved",
  "/demo": "/home",
  "/my-projects": "/mypage?tab=developer",
};

export function resolveV0LegacyRedirect(pathname: string): string | null {
  return V0_LEGACY_REDIRECTS[pathname] ?? null;
}
