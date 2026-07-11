import type { Game } from "@/lib/mock-games";

/** 編集パネル未保存入力を左プレビューへ反映するための部分上書き */
export type StudioEditPreviewPatch = Partial<
  Pick<
    Game,
    | "title"
    | "description"
    | "phase"
    | "genres"
    | "genre"
    | "tags"
    | "thumbnailUrls"
    | "thumbnailUrl"
    | "overviewIntroduction"
    | "playUrl"
    | "estimatedPlayTime"
    | "visibility"
    | "steamUrl"
    | "itchUrl"
    | "discordUrl"
    | "xUrl"
    | "officialUrl"
    | "youtubeUrl"
    | "githubUrl"
    | "publishDestinations"
    | "relatedLinks"
    | "playAccessType"
    | "releaseStatus"
  >
>;

export function mergeGameForStudioPreview(
  base: Game,
  patch: StudioEditPreviewPatch | null,
): Game {
  if (!patch || Object.keys(patch).length === 0) {
    return base;
  }
  return { ...base, ...patch };
}
