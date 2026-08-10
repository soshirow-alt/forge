"use client";

import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import {
  COLLAB_CONSULTATION_START_PURPOSES,
  isCollabConsultationPurpose,
  type CollabConsultationPurpose,
} from "@/lib/collab/consultation-types";
import { resolveProjectThumbnailUrls } from "@/lib/project-thumbnails";

export type ConsultationStartFormProps = {
  counterpartId: string;
  counterpartName: string;
  /** Prefilled target project (from project detail CTA). */
  counterpartProjectId?: string | null;
  onSuccess: (consultationId: string) => void;
  onCancel?: () => void;
  compact?: boolean;
};

export function ConsultationStartForm({
  counterpartId,
  counterpartName,
  counterpartProjectId = null,
  onSuccess,
  onCancel,
  compact = false,
}: ConsultationStartFormProps) {
  const { user } = useAuth();
  const { getGameById, getOwnedProjects } = useGames();
  const [purpose, setPurpose] = useState<CollabConsultationPurpose>(
    counterpartProjectId ? "use_their_work" : "other",
  );
  const [initiatorProjectId, setInitiatorProjectId] = useState<string>("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const targetProject = counterpartProjectId
    ? getGameById(counterpartProjectId)
    : null;
  const targetThumb = targetProject
    ? resolveProjectThumbnailUrls(targetProject)[0] ?? null
    : null;
  const owned = user?.id ? getOwnedProjects(user.id) : [];

  async function submit() {
    const text = body.trim();
    if (!text || sending) return;
    if (!isCollabConsultationPurpose(purpose)) {
      setError("相談内容を選択してください。");
      return;
    }
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/collab/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counterpartId,
          purpose,
          firstMessage: text,
          counterpartProjectId: counterpartProjectId || null,
          initiatorProjectId: initiatorProjectId || null,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || "メッセージを送信できませんでした。");
      }
      const result = (await response.json()) as { consultationId: string };
      onSuccess(result.consultationId);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "メッセージを送信できませんでした。",
      );
      setSending(false);
    }
  }

  return (
    <div
      className={`rounded-xl border border-zinc-700 bg-zinc-950 ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <p className="text-xs font-medium text-zinc-400">
        {counterpartProjectId ? "相談を始める" : `${counterpartName}へメッセージ`}
      </p>

      {targetProject ? (
        <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-2">
          {targetThumb ? (
            <span className="relative size-10 shrink-0 overflow-hidden rounded-md border border-zinc-800">
              <Image
                src={targetThumb}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
                unoptimized
              />
            </span>
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-zinc-800 text-[10px] text-zinc-600">
              作品
            </span>
          )}
          <div className="min-w-0">
            <p className="text-[11px] text-zinc-500">相談対象作品</p>
            <p className="truncate text-sm text-zinc-200">{targetProject.title}</p>
          </div>
        </div>
      ) : null}

      <fieldset className="mt-3">
        <legend className="text-[11px] text-zinc-500">相談内容（必須）</legend>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {COLLAB_CONSULTATION_START_PURPOSES.map((item) => {
            const selected = purpose === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setPurpose(item.value)}
                className={`rounded-full border px-2.5 py-1 text-[11px] ${
                  selected
                    ? "border-violet-500/60 bg-violet-500/15 text-violet-100"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {owned.length > 0 ? (
        <label className="mt-3 block">
          <span className="text-[11px] text-zinc-500">自分の関連作品（任意）</span>
          <select
            value={initiatorProjectId}
            onChange={(event) => setInitiatorProjectId(event.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-sm text-zinc-200"
          >
            <option value="">選択しない</option>
            {owned.map((game) => (
              <option key={game.id} value={game.id}>
                {game.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="mt-3 block">
        <span className="text-[11px] text-zinc-500">メッセージ（必須）</span>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={4000}
          rows={compact ? 3 : 4}
          aria-label="メッセージ"
          placeholder="相談内容を書いて送信…"
          className="mt-1 w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm text-white"
        />
      </label>

      <div className="mt-2 flex items-center justify-end gap-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:border-zinc-600"
          >
            キャンセル
          </button>
        ) : null}
        <button
          type="button"
          disabled={!body.trim() || sending}
          onClick={() => void submit()}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {sending ? "送信中…" : "送信"}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
