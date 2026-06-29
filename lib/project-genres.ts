import {
  FORGE_GENRE_OPTIONS,
  type ForgeGenreOption,
} from "@/lib/forge-genre-options";

export const MAX_PROJECT_GENRES = 3;

const GENRE_SET = new Set<string>(FORGE_GENRE_OPTIONS);

export function pickForgeGenresFromList(values: string[]): ForgeGenreOption[] {
  return values.filter((value): value is ForgeGenreOption => GENRE_SET.has(value));
}

export function legacyGenreStringToGenres(genre: string | null | undefined): string[] {
  const trimmed = genre?.trim() ?? "";
  if (!trimmed) {
    return [];
  }
  if (trimmed.includes("・")) {
    return trimmed
      .split("・")
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [trimmed];
}

export function resolveProjectGenres(game: {
  genres?: string[] | null;
  genre?: string | null;
}): string[] {
  if (game.genres && game.genres.length > 0) {
    return [...game.genres];
  }
  return legacyGenreStringToGenres(game.genre);
}

export function formatProjectGenresLabel(genres: string[]): string {
  return genres.filter(Boolean).join("・");
}

export function genresToLegacyGenreColumn(genres: string[]): string {
  return formatProjectGenresLabel(genres);
}

export function sanitizeProjectGenresForSave(genres: string[]): ForgeGenreOption[] {
  const unique: ForgeGenreOption[] = [];
  for (const genre of genres) {
    if (!GENRE_SET.has(genre) || unique.includes(genre as ForgeGenreOption)) {
      continue;
    }
    unique.push(genre as ForgeGenreOption);
    if (unique.length >= MAX_PROJECT_GENRES) {
      break;
    }
  }
  return unique;
}

export function resolveGenresFromDbRow(row: {
  genres?: string[] | null;
  genre?: string | null;
}): string[] {
  if (row.genres && row.genres.length > 0) {
    return row.genres;
  }
  return legacyGenreStringToGenres(row.genre);
}

export function toggleForgeGenre(
  current: ForgeGenreOption[],
  genre: ForgeGenreOption,
): ForgeGenreOption[] {
  if (current.includes(genre)) {
    return current.filter((item) => item !== genre);
  }
  if (current.length >= MAX_PROJECT_GENRES) {
    return current;
  }
  return [...current, genre];
}
