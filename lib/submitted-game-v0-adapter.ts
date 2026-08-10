import type { GameDetailV0 } from "@/lib/game-detail-v0-mock-data";
import { pickFeatureTagsFromGameTags } from "@/lib/forge-feature-tag-options";
import type { Game } from "@/lib/mock-games";
import { getPublicGameTags } from "@/lib/play-environment";
import { resolveProjectGenres } from "@/lib/project-genres";
import {
  resolveDetailIntroduction,
  sanitizeOverviewFeatures,
} from "@/lib/project-overview";
import { resolveProjectThumbnailUrls } from "@/lib/project-thumbnails";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isSupabaseProjectId(id: string): boolean {
  return UUID_RE.test(id);
}

export function gameToDetailV0(game: Game): GameDetailV0 {
  const genres = resolveProjectGenres(game);
  const featureTags = pickFeatureTagsFromGameTags(getPublicGameTags(game.tags));
  const tags = [...genres, ...featureTags];
  const galleryImages = resolveProjectThumbnailUrls(game);
  const heroImage = galleryImages[0] ?? "";

  return {
    id: game.id,
    title: game.title,
    lead:
      game.description.length > 100
        ? `${game.description.slice(0, 100)}…`
        : game.description || game.title,
    tags,
    heroImage,
    galleryImages,
    currentVersion: game.playableVersion || "v0.1.0",
    developer: {
      id: game.ownerId || game.creator,
      name: game.ownerName || game.creator,
      avatar: "",
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
      "このverについての感想や、気になった点を教えてください。",
    wantedVoices: [
      "このverの全体の雰囲気はいかがでしたか？",
      "次のverで特に見てほしい点はありますか？",
    ],
    relatedTags: tags,
    relatedGames: [],
  };
}
