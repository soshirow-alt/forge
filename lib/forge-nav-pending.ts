/**
 * Shared pending-nav affordance for Forge shell Links (perceived perf only).
 * Matches mode-switch pending: opacity + aria-busy + short label swap where used.
 */
export const FORGE_NAV_PENDING_CLASS = " opacity-70 pointer-events-none";

export function forgeNavPendingLabel(pending: boolean, idle: string): string {
  return pending ? "移動中…" : idle;
}
