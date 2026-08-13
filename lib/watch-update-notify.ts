/**
 * Pure helpers for watch-update notification fanout (unit-testable).
 */

export function selectWatchUpdateRecipientIds(input: {
  watcherIds: readonly string[];
  actorUserId: string;
  confirmationRecipientIds?: readonly string[];
}): string[] {
  const confirmation = new Set(input.confirmationRecipientIds ?? []);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const watcherId of input.watcherIds) {
    if (!watcherId || watcherId === input.actorUserId) continue;
    if (confirmation.has(watcherId)) continue;
    if (seen.has(watcherId)) continue;
    seen.add(watcherId);
    out.push(watcherId);
  }
  return out;
}
