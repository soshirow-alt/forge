import {
  MAX_PROJECT_THUMBNAILS,
  RECOMMENDED_PROJECT_THUMBNAILS,
} from "@/lib/project-thumbnails";

export const PROJECT_INTRO_HINT =
  "作品詳細の「概要」タブに表示されます。一覧用の短い説明は先頭から自動生成されます。";

export const PROJECT_VISIBILITY_SECTION_HINT = "";

export const THUMBNAIL_LABEL = "サムネイル画像（3枚以上推奨）";

export const THUMBNAIL_HINT =
  "1枚目は作品一覧のメイン画像に使われます。2〜3枚目も追加すると、「注目の作品」などでゲームの雰囲気が伝わりやすくなります。";

export function formatThumbnailCountDisplay(count: number): string {
  const n = Math.max(0, Math.floor(count));
  if (n >= RECOMMENDED_PROJECT_THUMBNAILS) {
    return `${n} / ${RECOMMENDED_PROJECT_THUMBNAILS}枚以上　最大${MAX_PROJECT_THUMBNAILS}枚`;
  }
  return `${n} / ${RECOMMENDED_PROJECT_THUMBNAILS}枚（推奨）　最大${MAX_PROJECT_THUMBNAILS}枚`;
}

export function getThumbnailCountHelper(count: number): string {
  const n = Math.max(0, Math.floor(count));
  if (n === 0) {
    return "まずはメイン画像を1枚追加してください";
  }
  if (n === 1) {
    return "あと2枚追加すると、プレイヤーがゲームをイメージしやすくなります";
  }
  if (n === 2) {
    return "あと1枚で推奨枚数です";
  }
  return "3枚以上追加済み。作品の雰囲気をしっかり伝えられます";
}

export const PROJECT_ACCESS_SECTION_TITLE = "アクセス方法";

export const PROJECT_ACCESS_SECTION_HINT = "";
