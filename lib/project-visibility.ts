import type { Game } from "@/lib/mock-games";

export type ProjectVisibility = "public" | "private";

export const PROJECT_VISIBILITY_FORM_OPTIONS: {
  value: ProjectVisibility;
  label: string;
  hint: string;
}[] = [
  {
    value: "public",
    label: "公開",
    hint: "一覧・検索に表示され、プレイヤーが作品ページを見られます",
  },
  {
    value: "private",
    label: "非公開",
    hint: "自分だけ。準備ができたら公開に切り替え",
  },
];

export function isGamePublic(game: Pick<Game, "visibility">): boolean {
  return game.visibility !== "private";
}

export function getVisibilityBadgeLabel(
  visibility?: ProjectVisibility,
): "公開" | "非公開" {
  return visibility === "private" ? "非公開" : "公開";
}
