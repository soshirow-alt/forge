import { FORGE_GENRE_OPTIONS } from "@/lib/forge-genre-options";

export const UNSPECIFIED_GENRE = "ジャンル未設定" as const;

export const genreFilterOptions = [
  "すべて",
  UNSPECIFIED_GENRE,
  ...FORGE_GENRE_OPTIONS,
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
