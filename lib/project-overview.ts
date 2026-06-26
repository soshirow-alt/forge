import type { GameDetailFeature } from "@/lib/game-detail-v0-mock-data";

export type ProjectOverviewFeature = {
  title: string;
  description: string;
};

export const MAX_PROJECT_OVERVIEW_FEATURES = 4;

export const PARTIAL_OVERVIEW_FEATURE_ERROR =
  "タイトルと説明の両方を入れてください";

export function sanitizeOverviewFeatures(
  raw: unknown,
): ProjectOverviewFeature[] | null {
  if (!Array.isArray(raw)) {
    return null;
  }

  const valid = raw
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const title = String(
        (item as { title?: unknown }).title ?? "",
      ).trim();
      const description = String(
        (item as { description?: unknown }).description ?? "",
      ).trim();
      if (!title || !description) {
        return null;
      }
      return { title, description };
    })
    .filter((feature): feature is ProjectOverviewFeature => feature !== null)
    .slice(0, MAX_PROJECT_OVERVIEW_FEATURES);

  return valid.length > 0 ? valid : null;
}

export function prepareOverviewFeaturesForSave(
  features: GameDetailFeature[],
):
  | { ok: true; features: ProjectOverviewFeature[] }
  | { ok: false; error: string } {
  const valid: ProjectOverviewFeature[] = [];

  for (const feature of features) {
    const title = feature.title.trim();
    const description = feature.description.trim();
    if (!title && !description) {
      continue;
    }
    if (!title || !description) {
      return { ok: false, error: PARTIAL_OVERVIEW_FEATURE_ERROR };
    }
    valid.push({ title, description });
  }

  return {
    ok: true,
    features: valid.slice(0, MAX_PROJECT_OVERVIEW_FEATURES),
  };
}

export function normalizeOverviewIntroduction(intro: string): string | null {
  const trimmed = intro.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveDetailIntroduction(
  overviewIntroduction: string | null | undefined,
  description: string,
): string {
  const intro = overviewIntroduction?.trim();
  if (intro) {
    return intro;
  }
  return description.trim();
}
