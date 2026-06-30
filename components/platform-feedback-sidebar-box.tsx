"use client";

import { MessageSquare } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { V0SimpleModal } from "@/components/v0-simple-modal";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  PLATFORM_FEEDBACK_CATEGORIES,
  PLATFORM_FEEDBACK_MESSAGE_MAX,
  PLATFORM_FEEDBACK_MESSAGE_MIN,
  type PlatformFeedbackCategoryCode,
  type PlatformFeedbackViewerMode,
} from "@/lib/platform-feedback";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";

type PlatformFeedbackSidebarBoxProps = {
  viewerMode: PlatformFeedbackViewerMode;
};

export function PlatformFeedbackSidebarBox({
  viewerMode,
}: PlatformFeedbackSidebarBoxProps) {
  const pathname = usePathname();
  const { requireAuth } = useRequireAuth();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<PlatformFeedbackCategoryCode>("service");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const trimmedLength = message.trim().length;
  const canSubmit =
    trimmedLength >= PLATFORM_FEEDBACK_MESSAGE_MIN &&
    trimmedLength <= PLATFORM_FEEDBACK_MESSAGE_MAX &&
    !submitting;

  function resetForm() {
    setCategory("service");
    setMessage("");
    setDone(false);
    setErrorMessage(null);
  }

  function handleOpen() {
    requireAuth(() => {
      resetForm();
      setOpen(true);
    }, pathname);
  }

  function handleClose() {
    setOpen(false);
  }

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    if (!getOptionalSupabaseClient()) {
      setErrorMessage("送信できませんでした。しばらくしてからお試しください。");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/platform-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          message: message.trim(),
          pagePath: pathname,
          viewerMode,
        }),
      });

      if (response.status === 401) {
        setErrorMessage("ログインが必要です。");
        return;
      }

      if (response.status === 503) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        if (payload?.error === "Platform feedback is not ready yet") {
          setErrorMessage(
            "ご意見の受付は Coming Soon です。しばらくしてからお試しください。",
          );
        } else {
          setErrorMessage("送信できませんでした。しばらくしてからお試しください。");
        }
        return;
      }

      if (!response.ok) {
        setErrorMessage("送信できませんでした。しばらくしてからお試しください。");
        return;
      }

      setDone(true);
    } catch {
      setErrorMessage("送信できませんでした。しばらくしてからお試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/50 p-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
            <MessageSquare className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-200">運営へのご意見</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              不具合・Forge へのご要望など、お気軽にどうぞ。
            </p>
            <button
              type="button"
              onClick={handleOpen}
              className="mt-2.5 w-full rounded-lg border border-zinc-700 bg-zinc-950/80 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
            >
              送る
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <V0SimpleModal
          title="運営へのご意見"
          subtitle="いただいた内容はサービス改善の参考にします。個別の返信はお約束できません。"
          onClose={handleClose}
          size="lg"
        >
          {done ? (
            <div className="space-y-4">
              <p className="text-sm text-emerald-300">
                ご意見を受け付けました。ありがとうございます。
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white"
                >
                  閉じる
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <fieldset>
                <legend className="text-xs font-medium text-zinc-400">種類</legend>
                <ul className="mt-2 space-y-2">
                  {PLATFORM_FEEDBACK_CATEGORIES.map((item) => (
                    <li key={item.code}>
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                        <input
                          type="radio"
                          name="platform-feedback-category"
                          value={item.code}
                          checked={category === item.code}
                          onChange={() => setCategory(item.code)}
                          className="accent-violet-500"
                        />
                        {item.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>

              <label className="block text-xs text-zinc-500">
                内容
                <textarea
                  value={message}
                  onChange={(event) =>
                    setMessage(event.target.value.slice(0, PLATFORM_FEEDBACK_MESSAGE_MAX))
                  }
                  rows={6}
                  placeholder="具体的な状況や、Forge に期待することなどを記入してください"
                  className="mt-1 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600"
                />
                <span className="mt-1 block text-right text-xs text-zinc-600">
                  {trimmedLength}/{PLATFORM_FEEDBACK_MESSAGE_MAX}
                  {trimmedLength > 0 && trimmedLength < PLATFORM_FEEDBACK_MESSAGE_MIN
                    ? `（${PLATFORM_FEEDBACK_MESSAGE_MIN}文字以上）`
                    : null}
                </span>
              </label>

              {errorMessage ? (
                <p className="text-sm text-rose-300">{errorMessage}</p>
              ) : null}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={() => void handleSubmit()}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                >
                  {submitting ? "送信中…" : "送信する"}
                </button>
              </div>
            </div>
          )}
        </V0SimpleModal>
      ) : null}
    </>
  );
}
