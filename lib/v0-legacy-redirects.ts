/**
 * 旧UIルート → 正本へのリダイレクト。
 * middleware で auth gate（updateSession）より先に解決すること。
 * `/studio/settings` は Studio layout の auth gate より前に正本へ寄せる。
 * `/studio/profile` は Studio Shell 正本（リダイレクトしない）。
 */
export const V0_LEGACY_REDIRECTS: Readonly<Record<string, string>> = {
  "/bookmarks": "/mypage?tab=saved",
  "/my-projects": "/studio/mypage",
  "/studio/settings": "/settings",
};

export function resolveV0LegacyRedirect(pathname: string): string | null {
  return V0_LEGACY_REDIRECTS[pathname] ?? null;
}
