export type GameDetailTab = "overview" | "devlog" | "voices";

export function parseGameDetailTab(param: string | null): GameDetailTab {
  if (param === "versions") {
    return "devlog";
  }
  if (param === "devlog" || param === "voices") {
    return param;
  }
  return "overview";
}

export function buildGameDetailTabHref(
  gameId: string,
  tab: GameDetailTab,
  searchParams?: URLSearchParams | ReadonlyURLSearchParams,
): string {
  const params = new URLSearchParams(searchParams?.toString() ?? "");
  if (tab === "overview") {
    params.delete("tab");
  } else {
    params.set("tab", tab);
  }
  const base = `/games/${encodeURIComponent(gameId)}`;
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

type ReadonlyURLSearchParams = {
  toString(): string;
};
