/**
 * 旧UIルート → 正本へのリダイレクト。
 * middleware で auth gate（updateSession）より先に解決すること。
 * `/studio/settings` と `/studio/profile` は Studio Shell 正本（リダイレクトしない）。
 */
export const V0_LEGACY_REDIRECTS: Readonly<Record<string, string>> = {
  "/bookmarks": "/mypage?tab=saved",
  "/my-projects": "/studio/mypage",
};

export function resolveV0LegacyRedirect(pathname: string): string | null {
  return V0_LEGACY_REDIRECTS[pathname] ?? null;
}
