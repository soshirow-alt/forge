"use client";

import { useMemo, useState } from "react";
import { useRequireAuth } from "@/hooks/use-require-auth";

export function UsageRelationButton({
  focusProject,
  candidateProjects,
  className,
  fullWidth = false,
}: {
  focusProject: { id: string; title: string };
  candidateProjects: { id: string; title: string }[];
  className?: string;
  fullWidth?: boolean;
}) {
  const { hydrated, isLoggedIn } = useRequireAuth();
  const [open, setOpen] = useState(false);
  const [candidateId, setCandidateId] = useState(candidateProjects[0]?.id ?? "");
  const [direction, setDirection] = useState<"candidate_uses_focus" | "focus_uses_candidate">(
    "candidate_uses_focus",
  );
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");

  const eligible = isLoggedIn && candidateProjects.length > 0;
  const disabledReason = useMemo(() => {
    if (!hydrated) return "";
    if (!isLoggedIn) return "ログインして作品を登録すると利用できます";
    if (candidateProjects.length === 0) {
      return "作品を登録しているユーザーが利用できます";
    }
    return "";
  }, [hydrated, isLoggedIn, candidateProjects.length]);

  const selectedCandidateId = candidateProjects.some((project) => project.id === candidateId)
    ? candidateId
    : (candidateProjects[0]?.id ?? "");
  const candidate = candidateProjects.find((item) => item.id === selectedCandidateId);

  const baseClass =
    className ??
    "rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:border-violet-500/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-zinc-700";

  function start() {
    if (!hydrated || !eligible) return;
    setOpen(true);
  }

  async function submit() {
    if (!candidate) return;
    const sourceProjectId =
      direction === "candidate_uses_focus" ? candidate.id : focusProject.id;
    const targetProjectId =
      direction === "candidate_uses_focus" ? focusProject.id : candidate.id;
    try {
      const response = await fetch("/api/usage-relations/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceProjectId, targetProjectId, note }),
      });
      if (!response.ok) {
        throw new Error("request failed");
      }
      setStatus("確認依頼を送りました。");
    } catch {
      setStatus("使用関係を登録できませんでした。");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={!hydrated || !eligible}
        title={disabledReason || undefined}
        aria-disabled={!hydrated || !eligible}
        className={`${baseClass} ${fullWidth ? "w-full" : ""}`}
      >
        使用関係を登録
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-950 p-5">
            <h2 className="text-lg font-semibold text-white">使用関係を登録</h2>
            {candidate ? (
              <>
                <label className="mt-4 block text-sm text-zinc-300">
                  関係する作品
                  <select
                    value={selectedCandidateId}
                    onChange={(event) => setCandidateId(event.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
                  >
                    {candidateProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="mt-4 grid gap-2">
                  <button
                    type="button"
                    onClick={() => setDirection("candidate_uses_focus")}
                    className={`rounded-xl border p-3 text-left text-sm ${
                      direction === "candidate_uses_focus"
                        ? "border-violet-500 bg-violet-500/10 text-white"
                        : "border-zinc-800 text-zinc-400"
                    }`}
                  >
                    <strong>{candidate.title}</strong> → 使用 →{" "}
                    <strong>{focusProject.title}</strong>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection("focus_uses_candidate")}
                    className={`rounded-xl border p-3 text-left text-sm ${
                      direction === "focus_uses_candidate"
                        ? "border-violet-500 bg-violet-500/10 text-white"
                        : "border-zinc-800 text-zinc-400"
                    }`}
                  >
                    <strong>{focusProject.title}</strong> → 使用 →{" "}
                    <strong>{candidate.title}</strong>
                  </button>
                </div>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="補足（任意）"
                  rows={3}
                  className="mt-4 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm text-white"
                />
              </>
            ) : null}
            {status ? <p className="mt-3 text-sm text-zinc-300">{status}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-zinc-400"
              >
                閉じる
              </button>
              {candidate ? (
                <button
                  type="button"
                  onClick={() => void submit()}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  確認を依頼
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
