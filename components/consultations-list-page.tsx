"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import { PlayerShell } from "@/components/player-shell";
import {
  consultationPurposeLabel,
  type CollabConsultationSummary,
} from "@/lib/collab/consultation-types";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import {
  decideProjectUsageRelation,
  fetchMyDecidedUsageRelations,
  fetchMyPendingUsageRelations,
  fetchUsageRelationByIdForRequester,
  parseUsageRelationFocusId,
  type UsageRelationRequest,
} from "@/lib/supabase/usage-relations-write-db";
import { acknowledgeNotificationsByCoalesceKey } from "@/lib/supabase/user-notifications-db";

function mergeDecidedRelations(
  recent: UsageRelationRequest[],
  focused: UsageRelationRequest | null,
): UsageRelationRequest[] {
  if (!focused) return recent;
  if (recent.some((row) => row.id === focused.id)) return recent;
  return [focused, ...recent];
}

export function ConsultationsListPage() {
  const { user } = useAuth();
  const { getOwnedProjects, getGameById } = useGames();
  const [consultations, setConsultations] = useState<CollabConsultationSummary[]>([]);
  const [relations, setRelations] = useState<UsageRelationRequest[]>([]);
  const [decidedRelations, setDecidedRelations] = useState<UsageRelationRequest[]>([]);
  const [error, setError] = useState("");
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const [reloadToken, setReloadToken] = useState(0);
  /** Bumped only after decided relations are in state; ack runs in a later effect (post-display). */
  const [decidedAckToken, setDecidedAckToken] = useState(0);
  /** When set, post-display ack targets only this focused relation (hash deep-link). */
  const [focusedAckRelationId, setFocusedAckRelationId] = useState<string | null>(null);

  useEffect(() => {
    if (decidedAckToken === 0) return;
    const supabase = getOptionalSupabaseClient();
    if (!supabase) return;
    let cancelled = false;
    void Promise.resolve()
      .then(async () => {
        if (focusedAckRelationId) {
          const shown = decidedRelations.some((row) => row.id === focusedAckRelationId);
          if (!shown) return;
          await acknowledgeNotificationsByCoalesceKey(
            supabase,
            `usage-relation:${focusedAckRelationId}`,
          );
          return;
        }
        if (decidedRelations.length === 0) return;
        for (const relation of decidedRelations) {
          if (cancelled) return;
          await acknowledgeNotificationsByCoalesceKey(
            supabase,
            `usage-relation:${relation.id}`,
          );
        }
      })
      .catch(() => {
        // Display already succeeded; ack failure is non-blocking (same spirit as consultation retry).
      });
    return () => {
      cancelled = true;
    };
  }, [decidedAckToken, decidedRelations, focusedAckRelationId]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve()
      .then(async () => {
        const response = await fetch("/api/collab/consultations", { cache: "no-store" });
        if (!response.ok) throw new Error("相談を読み込めませんでした。");
        const result = (await response.json()) as {
          consultations: CollabConsultationSummary[];
        };
        if (cancelled) return;
        setConsultations(result.consultations);
        if (!user) {
          setRelations([]);
          setDecidedRelations([]);
          setFocusedAckRelationId(null);
          return;
        }
        const supabase = getOptionalSupabaseClient();
        if (!supabase) return;
        const ownedIds = getOwnedProjects(user.id).map((project) => project.id);
        const focusId =
          typeof window !== "undefined"
            ? parseUsageRelationFocusId(window.location.hash)
            : null;
        const [nextRelations, nextDecided, focused] = await Promise.all([
          fetchMyPendingUsageRelations(supabase, user.id, ownedIds),
          fetchMyDecidedUsageRelations(supabase, user.id),
          focusId
            ? fetchUsageRelationByIdForRequester(supabase, user.id, focusId)
            : Promise.resolve(null),
        ]);
        if (cancelled) return;
        const merged = mergeDecidedRelations(nextDecided, focused);
        setRelations(nextRelations);
        setDecidedRelations(merged);
        setFocusedAckRelationId(focused ? focused.id : null);
        // Schedule ack after React commits the decided-relations UI update.
        setDecidedAckToken((token) => token + 1);
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "読み込めませんでした。");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, getOwnedProjects, reloadToken]);

  async function decide(id: string, decision: "accepted" | "rejected") {
    const supabase = getOptionalSupabaseClient();
    if (!supabase) return;
    setDecidingId(id);
    setError("");
    try {
      await decideProjectUsageRelation(supabase, id, decision);
      try {
        await acknowledgeNotificationsByCoalesceKey(supabase, `usage-relation:${id}`);
      } catch {
        setError("決定は保存されましたが、通知の状態を更新できませんでした。");
      }
      setReloadToken((token) => token + 1);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "使用関係の決定を保存できませんでした。",
      );
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <PlayerShell activeNav="consultations">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-white">相談</h1>
        <section id="usage-relations" className="mt-7 scroll-mt-24">
          <h2 className="text-sm font-semibold text-zinc-400">使用関係の確認</h2>
          {relations.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {relations.map((relation) => {
                const source =
                  getGameById(relation.sourceProjectId)?.title ?? "利用する作品";
                const target =
                  getGameById(relation.targetProjectId)?.title ?? "利用される作品";
                return (
                  <li
                    key={relation.id}
                    id={`usage-relation-${relation.id}`}
                    className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"
                  >
                    <p className="font-medium text-white">
                      {source} <span className="px-2 text-amber-300">→ 使用 →</span>{" "}
                      {target}
                    </p>
                    {relation.requestNote ? (
                      <p className="mt-2 text-sm text-zinc-400">{relation.requestNote}</p>
                    ) : null}
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={decidingId === relation.id}
                        onClick={() => void decide(relation.id, "accepted")}
                        className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                      >
                        承認
                      </button>
                      <button
                        type="button"
                        disabled={decidingId === relation.id}
                        onClick={() => void decide(relation.id, "rejected")}
                        className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 disabled:opacity-50"
                      >
                        承認しない
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">確認待ちの使用関係はありません。</p>
          )}
          <h3 className="mt-5 text-xs font-semibold text-zinc-500">最近の結果</h3>
          {decidedRelations.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {decidedRelations.map((relation) => {
                const source =
                  getGameById(relation.sourceProjectId)?.title ?? "利用する作品";
                const target =
                  getGameById(relation.targetProjectId)?.title ?? "利用される作品";
                const label =
                  relation.status === "accepted" ? "承認された" : "承認されなかった";
                return (
                  <li
                    key={relation.id}
                    id={`usage-relation-${relation.id}`}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-zinc-200">
                        {source} <span className="px-1 text-zinc-500">→</span> {target}
                      </p>
                      <span
                        className={
                          relation.status === "accepted"
                            ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300"
                            : "rounded-full bg-zinc-700/50 px-2 py-0.5 text-xs text-zinc-400"
                        }
                      >
                        {label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-zinc-600">最近の結果はまだありません。</p>
          )}
        </section>
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-zinc-400">コラボ相談</h2>
          {consultations.length ? (
            <ul className="mt-3 space-y-2">
              {consultations.map((item) => (
                <li key={item.consultationId}>
                  <Link
                    href={`/consultations/${item.consultationId}`}
                    className="block rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 hover:border-violet-500/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-white">
                        {consultationPurposeLabel(item.purpose)}
                      </p>
                      {item.unreadCount > 0 ? (
                        <span className="rounded-full bg-violet-600 px-2 py-0.5 text-xs text-white">
                          {item.unreadCount}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                      {item.lastMessageBody ?? "メッセージはありません"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
              相談はまだありません。
            </p>
          )}
        </section>
        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      </div>
    </PlayerShell>
  );
}
