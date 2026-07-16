export const AGE_RATING_VALUES = ["general", "r18"] as const;

export type AgeRating = (typeof AGE_RATING_VALUES)[number];

export const DEFAULT_AGE_RATING: AgeRating = "general";

/** Browser-local self-declared age verification (not identity proof). */
export const AGE_VERIFIED_STORAGE_KEY = "forge_age_verified_v1";

export function normalizeAgeRating(value: unknown): AgeRating {
  if (value === "r18") {
    return "r18";
  }
  return "general";
}

export function isR18AgeRating(value: unknown): boolean {
  return normalizeAgeRating(value) === "r18";
}

export function readAgeVerifiedFromStorage(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }
    return window.localStorage.getItem(AGE_VERIFIED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeAgeVerifiedToStorage(): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(AGE_VERIFIED_STORAGE_KEY, "1");
  } catch {
    // localStorage unavailable — gate will re-prompt next visit
  }
}
