export const PROJECT_ONE_LINE_DESCRIPTION_MAX = 60;

export const PROJECT_ONE_LINE_DESCRIPTION_HINT =
  "公開ページ上部に表示される短い紹介文です。60文字まで。";

export const PROJECT_ONE_LINE_DESCRIPTION_HERO_CLASS =
  "mt-2 line-clamp-2 min-w-0 break-words text-sm leading-relaxed";

export function validateProjectOneLineDescription(
  value: string,
): string | null {
  if (value.trim().length > PROJECT_ONE_LINE_DESCRIPTION_MAX) {
    return `キャッチコピーは${PROJECT_ONE_LINE_DESCRIPTION_MAX}文字以内にしてください。`;
  }
  return null;
}

export function clampProjectOneLineDescription(value: string): string {
  return value.slice(0, PROJECT_ONE_LINE_DESCRIPTION_MAX);
}
