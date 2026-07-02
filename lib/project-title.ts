export const PROJECT_TITLE_MAX = 40;

export const PROJECT_TITLE_HINT = "40文字まで";

export const PROJECT_TITLE_HERO_CLASS =
  "min-w-0 break-words line-clamp-2 text-2xl font-bold tracking-tight sm:text-3xl";

export function validateProjectTitle(value: string): string | null {
  if (value.trim().length > PROJECT_TITLE_MAX) {
    return `タイトルは${PROJECT_TITLE_MAX}文字以内にしてください。`;
  }
  return null;
}

export function clampProjectTitle(value: string): string {
  return value.slice(0, PROJECT_TITLE_MAX);
}
