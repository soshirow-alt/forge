export const UNSPECIFIED_GENRE = "ジャンル未設定" as const;

export const genreFilterOptions = [
  "すべて",
  UNSPECIFIED_GENRE,
  "アクション",
  "アドベンチャー",
  "RPG",
  "シミュレーション",
  "サバイバル",
  "パズル",
  "ホラー",
  "ノベル",
  "ストラテジー",
  "クラフト",
  "探索",
  "経営",
  "ストーリー",
  "癒し系",
  "ローグライク",
  "SF",
  "ファンタジー",
  "インディー",
] as const;

export type GenreFilterOption = (typeof genreFilterOptions)[number];

export function isUnspecifiedGenre(genre: string | undefined | null): boolean {
  return !genre || genre.trim() === "";
}

export function gameMatchesGenreFilter(
  selected: GenreFilterOption,
  primaryGenre: string | undefined | null,
  extraTags: readonly string[] = [],
): boolean {
  if (selected === "すべて") {
    return true;
  }
  if (selected === UNSPECIFIED_GENRE) {
    return isUnspecifiedGenre(primaryGenre);
  }
  if (primaryGenre === selected) {
    return true;
  }
  return extraTags.includes(selected);
}
