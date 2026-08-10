"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  COLLAB_CONSULTATION_PURPOSES,
  type CollabConsultationPurpose,
} from "@/lib/collab/consultation-types";

export function StartConsultationButton({
  counterpartId,
  counterpartProjectId,
  initiatorProjects = [],
  label = "利用・コラボを相談する",
}: {
  counterpartId: string;
  counterpartProjectId?: string | null;
  initiatorProjects?: { id: string; title: string }[];
  label?: string;
}) {
  const router = useRouter();
  const { hydrated, isLoggedIn, goToLogin } = useRequireAuth();
  const [open, setOpen] = useState(false);
  const [purpose, setPurpose] =
    useState<CollabConsultationPurpose>("use_their_work");
  const [initiatorProjectId, setInitiatorProjectId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function start() {
    if (!hydrated) return;
    if (!isLoggedIn) {
      goToLogin();
      return;
    }
    setOpen(true);
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/collab/consultations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          counterpartId,
          purpose,
          firstMessage: message,
          initiatorProjectId: initiatorProjectId || null,
          counterpartProjectId: counterpartProjectId ?? null,
        }),
      });
      const result = (await response.json()) as {
        consultationId?: string;
        error?: string;
      };
      if (!response.ok || !result.consultationId) {
        throw new Error(result.error || "相談を開始できませんでした。");
      }
      router.push(`/consultations/${result.consultationId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "相談を開始できませんでした。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={start}
        className="rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-2.5 text-sm font-medium text-violet-200 hover:bg-violet-500/20"
      >
        {label}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-consultation-title"
            className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl"
          >
            <h2 id="start-consultation-title" className="text-lg font-semibold text-white">
              利用・コラボを相談する
            </h2>
            <label className="mt-4 block text-sm text-zinc-300">
              相談の目的
              <select
                value={purpose}
                onChange={(event) =>
                  setPurpose(event.target.value as CollabConsultationPurpose)
                }
                className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
              >
                {COLLAB_CONSULTATION_PURPOSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            {initiatorProjects.length > 0 ? (
              <label className="mt-4 block text-sm text-zinc-300">
                自分の関連作品（任意）
                <select
                  value={initiatorProjectId}
                  onChange={(event) => setInitiatorProjectId(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
                >
                  <option value="">選択しない</option>
                  {initiatorProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="mt-4 block text-sm text-zinc-300">
              最初のメッセージ
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={4000}
                rows={6}
                className="mt-1.5 w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
              />
            </label>
            {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-white"
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={submitting || !message.trim()}
                onClick={() => void submit()}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {submitting ? "送信中..." : "相談を開始"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
