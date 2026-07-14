/**
 * 旧UIルート → 正本へのリダイレクト。
 * middleware で auth gate（updateSession）より先に解決すること。
 * `/studio/profile`・`/studio/settings` は Studio layout の auth gate より前に正本へ寄せ、
 * 未ログイン時の login return が旧 Studio 経路にならないようにする。
 */
export const V0_LEGACY_REDIRECTS: Readonly<Record<string, string>> = {
  "/bookmarks": "/mypage?tab=saved",
  "/my-projects": "/studio/mypage",
  "/studio/profile": "/mypage/profile",
  "/studio/settings": "/settings",
};

export function resolveV0LegacyRedirect(pathname: string): string | null {
  return V0_LEGACY_REDIRECTS[pathname] ?? null;
}
