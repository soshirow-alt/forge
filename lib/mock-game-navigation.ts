/**
 * Preview / mock UI のみ — タイトル文字列から mock catalog の slug を解決する。
 * 本番の Supabase 作品タイトルには使わない（一致しなければ slug としてそのまま encode）。
 */
import { buildGameDetailTabHref, type GameDetailTab } from "@/lib/game-detail-tabs";
import { resolveMockGameDetailSlug } from "@/lib/game-detail-v0-mock-data";

export function mockGameDetailHrefFromTitle(title: string): string {
  const slug = resolveMockGameDetailSlug(title);
  return `/games/${encodeURIComponent(slug)}`;
}

export function mockGameDetailHrefWithTabFromTitle(
  title: string,
  tab: GameDetailTab,
): string {
  const slug = resolveMockGameDetailSlug(title);
  return buildGameDetailTabHref(slug, tab);
}
