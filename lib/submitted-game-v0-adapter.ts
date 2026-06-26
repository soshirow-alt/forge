import type { GameDetailV0 } from "@/lib/game-detail-v0-mock-data";
import type { Game } from "@/lib/mock-games";
import {
  resolveDetailIntroduction,
  sanitizeOverviewFeatures,
} from "@/lib/project-overview";

const DEFAULT_HERO = "/images/landing/game-1.png";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isSupabaseProjectId(id: string): boolean {
  return UUID_RE.test(id);
}

export function gameToDetailV0(game: Game): GameDetailV0 {
  const tags =
    game.tags.length > 0 ? game.tags : [game.genre].filter(Boolean);

  return {
    id: game.id,
    title: game.title,
    lead:
      game.description.length > 100
        ? `${game.description.slice(0, 100)}…`
        : game.description || game.title,
    tags,
    heroImage: game.thumbnailUrl || DEFAULT_HERO,
    galleryImages: [game.thumbnailUrl || DEFAULT_HERO],
    currentVersion: game.playableVersion || "v0.1.0",
    developer: {
      id: game.ownerId || game.creator,
      name: game.ownerName || game.creator,
      avatar: game.thumbnailUrl || DEFAULT_HERO,
      followers: 0,
      bio: "",
      following: false,
    },
    witnessCount: 0,
    voiceCount: 0,
    devlogUpdatedAgo: game.lastUpdated,
    lastUpdated: game.lastUpdated,
    watching: false,
    saved: false,
    introduction: resolveDetailIntroduction(
      game.overviewIntroduction,
      game.description,
    ),
    features: sanitizeOverviewFeatures(game.overviewFeatures) ?? [],
    developerWorry:
      game.focusNotes?.trim() ||
      "このverを遊んだ感想や、気になった点を教えてください。",
    wantedVoices: [
      "このverは全体の雰囲気はいかがでしたか？",
      "もう一度遊びたいと思いましたか？",
    ],
    relatedTags: tags,
    relatedGames: [],
  };
}
