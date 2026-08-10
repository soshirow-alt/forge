"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useGames } from "@/components/games-provider";
import type { CollabConsultationSummary } from "@/lib/collab/consultation-types";

function shortUserId(userId: string): string {
  return userId.length > 8 ? `${userId.slice(0, 8)}…` : userId;
}

export function MessagesDraftRoom({
  counterpartId,
  counterpartProjectId = null,
}: {
  counterpartId: string;
  counterpartProjectId?: string | null;
}) {
  const router = useRouter();
  const { getDeveloperProfileByUserId, getGameById } = useGames();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(true);

  const profile = getDeveloperProfileByUserId(counterpartId);
  const displayName = profile?.publicName?.trim() || shortUserId(counterpartId);
  const projectTitle = useMemo(() => {
    if (!counterpartProjectId) return null;
    return getGameById(counterpartProjectId)?.title ?? null;
  }, [counterpartProjectId, getGameById]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve()
      .then(async () => {
        const response = await fetch("/api/collab/consultations", { cache: "no-store" });
        if (!response.ok) return;
        const result = (await response.json()) as {
          consultations: CollabConsultationSummary[];
        };
        if (cancelled) return;
        // Pair identity: one open thread per counterpart (ignore project match).
        const match = result.consultations.find(
          (item) => item.status === "open" && item.counterpartId === counterpartId,
        );
        if (match) {
          router.replace(`/messages/${match.consultationId}`);
          return;
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setResolving(false);
      });
    return () => {
      cancelled = true;
    };
  }, [counterpartId, router]);

  async function send() {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/collab/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counterpartId,
          purpose: "other",
          firstMessage: text,
          counterpartProjectId: counterpartProjectId || null,
          initiatorProjectId: null,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || "メッセージを送信できませんでした。");
      }
      const result = (await response.json()) as { consultationId: string };
      router.replace(`/messages/${result.consultationId}`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "メッセージを送信できませんでした。",
      );
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/messages" className="text-sm text-violet-300">
        ← メッセージ
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-white">{displayName}</h1>
      {projectTitle ? (
        <div className="mt-2">
          <span className="rounded-md border border-zinc-800 bg-zinc-900/80 px-2 py-0.5 text-[11px] text-zinc-400">
            {projectTitle}
          </span>
        </div>
      ) : null}
      {resolving ? (
        <p className="mt-6 text-sm text-zinc-500">既存の会話を確認しています…</p>
      ) : (
        <div className="sticky bottom-3 mt-6 rounded-xl border border-zinc-700 bg-zinc-950 p-3">
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={4000}
            rows={4}
            aria-label="メッセージ"
            placeholder="メッセージを入力…"
            className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-white"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              disabled={!body.trim() || sending}
              onClick={() => void send()}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {sending ? "送信中…" : "送信"}
            </button>
          </div>
        </div>
      )}
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
