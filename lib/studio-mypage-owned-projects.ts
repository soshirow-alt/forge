import type { Game } from "@/lib/mock-games";
import {
  studioProjectsAll,
  type StudioProjectCard,
} from "@/lib/studio-projects-v0-mock-data";

/** Preview mock 行 — UI の mode 分岐ではなくデータ上の識別子 */
export const STUDIO_MYPAGE_PREVIEW_MOCK_OWNER_ID = "__forge_preview_mypage_mock__";

export function studioProjectCardsToOwnedGames(cards: StudioProjectCard[]): Game[] {
  return cards.map((card) => ({
    id: card.id,
    title: card.title,
    genre: card.genres.split("・")[0]?.trim() || card.genres,
    genres: card.genres.split("・").map((g) => g.trim()),
    status: card.phase,
    creator: "Preview",
    phase: card.phase,
    description: "",
    lookingForTesters: false,
    lastUpdated: card.updatedLabel,
    section: "new",
    thumbnailUrl: card.image,
    tags: [],
    playUrl: "",
    ownerId: STUDIO_MYPAGE_PREVIEW_MOCK_OWNER_ID,
    visibility: "public",
    playableVersion: card.version ?? undefined,
  }));
}

export function isStudioMypagePreviewMockProject(game: Game): boolean {
  return game.ownerId === STUDIO_MYPAGE_PREVIEW_MOCK_OWNER_ID;
}

/**
 * `/studio/mypage` 作品一覧のデータ源（mode 判定は provider から渡す）
 * - 本番: 実データのみ（0 件なら空）
 * - Preview/local: 実データ優先。0 件なら mock を Game[] として返す
 */
export function resolveStudioMypageOwnedProjects(
  realOwned: Game[],
  hideV0Mock: boolean,
): Game[] {
  if (hideV0Mock) {
    return realOwned;
  }
  if (realOwned.length > 0) {
    return realOwned;
  }
  return studioProjectCardsToOwnedGames(studioProjectsAll);
}
