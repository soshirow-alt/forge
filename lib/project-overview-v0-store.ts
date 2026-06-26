import type { GameDetailFeature } from "@/lib/game-detail-v0-mock-data";
import { resolveGameDetailId, type GameDetailV0 } from "@/lib/game-detail-v0-mock-data";

const STORAGE_KEY = "forge-v0-project-overview";
const CHANGE_EVENT = "forge-project-overview-change";

export type ProjectOverviewDraft = {
  introduction?: string;
  features?: GameDetailFeature[];
};

type OverviewStore = Record<string, ProjectOverviewDraft>;

function readStore(): OverviewStore {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as OverviewStore;
  } catch {
    return {};
  }
}

function writeStore(store: OverviewStore): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function overviewStorageKey(id: string): string {
  return resolveGameDetailId(id);
}

export function getProjectOverview(id: string): ProjectOverviewDraft | null {
  const key = overviewStorageKey(id);
  const draft = readStore()[key];
  if (!draft) {
    return null;
  }
  return { ...draft };
}

export function saveProjectOverview(
  id: string,
  draft: ProjectOverviewDraft,
): void {
  const key = overviewStorageKey(id);
  const store = readStore();
  const trimmedFeatures =
    draft.features
      ?.map((feature) => ({
        title: feature.title.trim(),
        description: feature.description.trim(),
      }))
      .filter((feature) => feature.title.length > 0)
      .slice(0, 4) ?? [];

  const next: ProjectOverviewDraft = {
    introduction: draft.introduction?.trim() || undefined,
    features: trimmedFeatures.length > 0 ? trimmedFeatures : undefined,
  };

  if (!next.introduction && !next.features?.length) {
    delete store[key];
  } else {
    store[key] = next;
  }

  writeStore(store);
}

export function applyProjectOverviewV0(
  game: GameDetailV0,
  id: string,
): GameDetailV0 {
  const saved = getProjectOverview(id);
  if (!saved) {
    return game;
  }

  return {
    ...game,
    introduction: saved.introduction ?? game.introduction,
    features:
      saved.features && saved.features.length > 0
        ? saved.features
        : game.features,
  };
}

export function subscribeProjectOverview(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handler = () => listener();
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

export const MAX_PROJECT_FEATURES = 4;

export function emptyFeatureDraft(): GameDetailFeature {
  return { title: "", description: "" };
}
