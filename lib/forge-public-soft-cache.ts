/**
 * Forge public soft-cache policy (auth-independent Discovery only).
 *
 * - Scope: Player IA Home / Category Home / Game Home / Search public catalog.
 * - Data: anon public shelves & catalog only — never user-private fields.
 * - TTL: 20_000 ms in-process memory (Node serverless instance).
 * - Stale: intentional short window so repeat nav (Studio→Player, Search remount)
 *   skips FB-fill / catalog RPCs; new public rows appear within ~20s.
 * - Invalidation: TTL expiry only (no cross-user keys — public payloads).
 * - Single-flight: concurrent cold misses share one in-flight Promise per key.
 * - Not for: Studio metrics, messages, owned projects, notifications (user-scoped).
 */
export const FORGE_PUBLIC_SOFT_CACHE_TTL_MS = 20_000;
