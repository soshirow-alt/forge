import {
  formatRelativeUpdateLabel,
  getPublicSubmittedGames,
  sortGamesByUpdated,
} from "@/lib/discovery-public-games";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import { resolvePlayableVersion } from "@/lib/playable-version";
import { fetchProjects } from "@/lib/supabase/projects";
import { createClient } from "@/lib/supabase/server";

export type LandingFeaturedGame = {
  id: string;
  title: string;
  description: string;
  image: string;
  genre: string;
  version: string;
  feedback: number;
  updated: string;
  href: string;
};

/** Preview v0 — LP ガワ確認用（本番同等モードでは使わない） */
export const landingMockFeaturedGames: LandingFeaturedGame[] = [
  {
    id: "seito-no-tabiji",
    title: "星灯の旅路",
    description: "夜の森を旅する短編アドベンチャー",
    feedback: 12,
    updated: "3日",
    image: "/images/landing/game-1.png",
    genre: "アドベンチャー",
    version: "v0.1.0",
    href: "/search",
  },
  {
    id: "roshin-no-zanko",
    title: "炉心の残光",
    description: "心の奥に残る、静かな物語",
    feedback: 8,
    updated: "5日",
    image: "/images/landing/game-2.png",
    genre: "ノベル",
    version: "v0.1.0",
    href: "/search",
  },
  {
    id: "fuyu-note",
    title: "浮遊ノート",
    description: "空に浮かぶ島々をめぐる記録",
    feedback: 23,
    updated: "7日",
    image: "/images/landing/game-3.png",
    genre: "探索",
    version: "v0.1.0",
    href: "/search",
  },
  {
    id: "natsu-no-mukougawa",
    title: "夏の向こう側",
    description: "あの夏の記憶を、もう一度",
    feedback: 15,
    updated: "2日",
    image: "/images/landing/game-4.png",
    genre: "アドベンチャー",
    version: "v0.1.0",
    href: "/search",
  },
  {
    id: "shinen-note",
    title: "深淵ノート",
    description: "失われた記憶を辿るRPG",
    feedback: 31,
    updated: "10日",
    image: "/images/landing/game-5.png",
    genre: "RPG",
    version: "v0.1.0",
    href: "/search",
  },
];

export async function loadLandingFeaturedGames(): Promise<LandingFeaturedGame[]> {
  const supabase = await createClient();
  if (!supabase) {
    return [];
  }

  const games = await fetchProjects(supabase);
  return sortGamesByUpdated(getPublicSubmittedGames(games))
    .slice(0, 5)
    .map((game) => ({
      id: game.id,
      title: game.title,
      description: game.description,
      image: game.thumbnailUrl?.trim() ?? "",
      genre: game.genre,
      version: resolvePlayableVersion(game.playableVersion),
      feedback: 0,
      updated: formatRelativeUpdateLabel(game.lastUpdated).replace(/更新$/, ""),
      href: gameDetailHref(game.id),
    }));
}
