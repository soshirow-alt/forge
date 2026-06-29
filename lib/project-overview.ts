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

/** 一覧・カード・ヒーロー用 — 作品紹介の先頭から自動生成 */
export const PROJECT_DESCRIPTION_MAX_LENGTH = 160;

export function deriveProjectDescription(introduction: string): string {
  const trimmed = introduction.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.length <= PROJECT_DESCRIPTION_MAX_LENGTH) {
    return trimmed;
  }

  const cut = trimmed.lastIndexOf(" ", PROJECT_DESCRIPTION_MAX_LENGTH);
  const index = cut > 80 ? cut : PROJECT_DESCRIPTION_MAX_LENGTH;
  return trimmed.slice(0, index).trimEnd();
}

/** 編集フォームの初期値 — 長文優先、未設定時は旧 description */
export function resolveEditableIntroduction(
  overviewIntroduction: string | null | undefined,
  description: string,
): string {
  const intro = overviewIntroduction?.trim();
  if (intro) {
    return intro;
  }
  return description.trim();
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
