import type { GameDetailTab } from "@/lib/game-detail-tabs";
import { projectStudioPath } from "@/lib/project-nurture-links";

/** Inline overview edit modes in StudioTabContextPanel */
export type StudioOverviewEditMode =
  | "basic-info"
  | "genres-tags"
  | "images"
  | "introduction"
  | "play-info"
  | "publication"
  | "visibility";

const OVERVIEW_EDIT_MODES = new Set<StudioOverviewEditMode>([
  "basic-info",
  "genres-tags",
  "images",
  "introduction",
  "play-info",
  "publication",
  "visibility",
]);

/** @deprecated Old modal trigger — maps to inline basic-info edit */
const LEGACY_EDIT_PROJECT = "project";

export function parseStudioOverviewEditMode(
  value: string | null,
): StudioOverviewEditMode | null {
  if (!value) {
    return null;
  }
  if (value === LEGACY_EDIT_PROJECT) {
    return "basic-info";
  }
  if (OVERVIEW_EDIT_MODES.has(value as StudioOverviewEditMode)) {
    return value as StudioOverviewEditMode;
  }
  return null;
}

export function studioOverviewEditHref(
  projectId: string,
  mode: StudioOverviewEditMode = "basic-info",
): string {
  return `${projectStudioPath(projectId)}?edit=${mode}`;
}

export function studioEditHref(
  projectId: string,
  options?: {
    tab?: GameDetailTab;
    edit?: StudioOverviewEditMode;
  },
): string {
  const base = projectStudioPath(projectId);
  const params = new URLSearchParams();
  if (options?.tab && options.tab !== "overview") {
    params.set("tab", options.tab);
  }
  if (options?.edit) {
    params.set("edit", options.edit);
  }
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
