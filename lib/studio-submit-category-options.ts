/**
 * Studio submit category picker options — formal ProjectCategoryId order.
 * Routing maps each id to the existing submit shells (game / prototype / asset common).
 */
import {
  PROJECT_CATEGORY_IDS,
  PROJECT_CATEGORY_LABELS,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import { SUBMIT_CATEGORY_PICK_HREF } from "@/lib/prototype/studio-submit-flow";

export type StudioSubmitCategoryOption = {
  id: ProjectCategoryId;
  title: string;
  hint: string;
};

const HINTS: Record<ProjectCategoryId, string> = {
  game: "ゲームや操作して楽しむ作品",
  audio: "楽曲・BGM・効果音・ボイス",
  asset: "素材・アセット（共通項目で投稿）",
  "dev-tool": "制作や開発を助けるツール",
  "service-app": "Webサービスや各種アプリ",
};

/** Same order as Player Search category tabs (without 「すべて」). */
export const STUDIO_SUBMIT_CATEGORY_OPTIONS: StudioSubmitCategoryOption[] =
  PROJECT_CATEGORY_IDS.map((id) => ({
    id,
    title: PROJECT_CATEGORY_LABELS[id],
    hint: HINTS[id],
  }));

export function studioSubmitHrefForCategory(id: ProjectCategoryId): string {
  if (id === "game") {
    return "/studio/submit";
  }
  return `${SUBMIT_CATEGORY_PICK_HREF}&category=${id}`;
}
