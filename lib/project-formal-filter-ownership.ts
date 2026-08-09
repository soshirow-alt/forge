/**
 * Ownership of migration-076-era formal filter columns / Search params.
 *
 * Purpose: stop inactive fields from being re-activated as Studio writes or
 * Player IA Search UI without an explicit product decision.
 *
 * DB columns and RPC args remain for compatibility — do not DROP here.
 */

export type FormalFilterOwnership =
  | "studio-owned"
  | "compatibility-only"
  | "inactive-search-ui"
  | "future-studio-candidate";

export type FormalFilterFieldSpec = {
  /** URL / RPC / column style id */
  id: string;
  ownership: FormalFilterOwnership;
  /** Studio write path today */
  studioWrite: "yes" | "no";
  /** Player IA Search UI control */
  playerIaSearchUi: "hidden" | "active" | "n/a";
  notes: string;
};

/**
 * Registry — keep in sync with PLAYER_IA_SEARCH_LEGACY_HIDDEN_PARAMS and Studio writers.
 */
export const PROJECT_FORMAL_FILTER_OWNERSHIP: FormalFilterFieldSpec[] = [
  {
    id: "quick_try",
    ownership: "compatibility-only",
    studioWrite: "no",
    playerIaSearchUi: "hidden",
    notes: "076 column + catalog RPC. Not Studio-owned. IA UI must stay hidden.",
  },
  {
    id: "usable_for_creation",
    ownership: "compatibility-only",
    studioWrite: "no",
    playerIaSearchUi: "hidden",
    notes: "076 column + catalog RPC. Not Studio-owned. IA UI must stay hidden.",
  },
  {
    id: "feedback_wanted",
    ownership: "inactive-search-ui",
    studioWrite: "no",
    playerIaSearchUi: "hidden",
    notes:
      "Maps to looking_for_testers filter in catalog RPC. Game Studio has lookingForTesters boolean, but IA Search must not expose feedback_wanted as an active chip until product GO.",
  },
  {
    id: "looking_for_testers",
    ownership: "studio-owned",
    studioWrite: "yes",
    playerIaSearchUi: "n/a",
    notes:
      "Studio boolean on game submit/edit. Distinct from hidden Search param feedback_wanted.",
  },
  {
    id: "stream_policy",
    ownership: "compatibility-only",
    studioWrite: "no",
    playerIaSearchUi: "hidden",
    notes: "076 column. No Studio write. IA Search UI hidden.",
  },
  {
    id: "asset_kinds",
    ownership: "studio-owned",
    studioWrite: "yes",
    playerIaSearchUi: "active",
    notes:
      "2026-08 five-category Studio: asset submit/edit writes projects.asset_kinds " +
      "from ASSET_KIND_CANONICAL_LABELS (registry field asset_kind). Multi-select, no game fallback.",
  },
  {
    id: "asset_kind",
    ownership: "studio-owned",
    studioWrite: "no",
    playerIaSearchUi: "active",
    notes:
      "Search URL param for asset_kinds. Now active multi (comma-separated) via registry " +
      "urlKey asset_kind; legacy single-value links still parse as a 1-item list.",
  },
  {
    id: "purpose_tags",
    ownership: "compatibility-only",
    studioWrite: "no",
    playerIaSearchUi: "n/a",
    notes:
      "076 column; seed/SQL primarily. Not mapped by projectRowToGame / Studio write.",
  },
  {
    id: "player_counts",
    ownership: "studio-owned",
    studioWrite: "yes",
    playerIaSearchUi: "active",
    notes:
      "2026-08 five-category Studio: game submit/edit writes projects.player_counts " +
      "text[] (registry field player_count). Distinct from legacy free-text notes.",
  },
];

export function formalFilterIdsWithOwnership(
  ownership: FormalFilterOwnership,
): string[] {
  return PROJECT_FORMAL_FILTER_OWNERSHIP.filter((f) => f.ownership === ownership).map(
    (f) => f.id,
  );
}

export function assertFormalFilterNotStudioWritten(id: string): void {
  const spec = PROJECT_FORMAL_FILTER_OWNERSHIP.find((f) => f.id === id);
  if (!spec) return;
  if (spec.studioWrite === "yes") return;
  throw new Error(
    `Formal filter "${id}" is ${spec.ownership} (studioWrite=${spec.studioWrite}); do not add Studio write without ownership change.`,
  );
}
