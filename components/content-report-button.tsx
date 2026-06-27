"use client";

import { useState } from "react";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  CONTENT_REPORT_REASONS,
  contentReportTargetLabel,
  isReportableContentId,
  type ContentReportReasonCode,
  type ContentReportTarget,
} from "@/lib/content-reports";
import { shouldHideV0MockContent } from "@/lib/production-mode";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import { submitContentReport } from "@/lib/supabase/content-reports-db";
import { Flag, X } from "lucide-react";

const DETAILS_MAX = 500;

type ContentReportButtonProps = {
  target: ContentReportTarget;
  returnPath: string;
  className?: string;
};

export function ContentReportButton({
  target,
  returnPath,
  className,
}: ContentReportButtonProps) {
  const { requireAuth } = useRequireAuth();
  const [open, setOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState<ContentReportReasonCode>("other");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!shouldHideV0MockContent() || !isReportableContentId(target.targetId)) {
    return null;
  }

  function resetForm() {
    setReasonCode("other");
    setDetails("");
    setDone(false);
    setErrorMessage(null);
  }

  function handleOpen() {
    requireAuth(() => {
      resetForm();
      setOpen(true);
    }, returnPath);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setErrorMessage(null);

    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      setErrorMessage("通報を送信できませんでした。しばらくしてからお試しください。");
      setSubmitting(false);
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setErrorMessage("ログインが必要です。");
        setSubmitting(false);
        return;
      }

      await submitContentReport(supabase, {
        reporterId: user.id,
        targetType: target.targetType,
        targetId: target.targetId,
        reasonCode,
        details,
        contextLabel: target.contextLabel,
      });
      setDone(true);
    } catch {
      setErrorMessage("通報を送信できませんでした。しばらくしてからお試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={
          className ??
          "inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-rose-300"
        }
      >
        <Flag className="size-3.5" aria-hidden="true" />
        通報
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label="閉じる"
            onClick={() => setOpen(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="content-report-title"
            className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="content-report-title" className="text-lg font-semibold text-white">
                  {contentReportTargetLabel(target.targetType)}を通報
                </h2>
                <p className="mt-1 text-xs text-zinc-500">{target.contextLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-zinc-700 p-1.5 text-zinc-400 hover:border-zinc-600 hover:text-white"
                aria-label="閉じる"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            {done ? (
              <div className="mt-5 space-y-4">
                <p className="text-sm text-emerald-300">
                  通報を受け付けました。内容を確認のうえ、必要に応じて対応します。
                </p>
                <p className="text-xs leading-relaxed text-zinc-500">
                  すべての通報に個別の返答をお約束するものではありません（利用規約 第12条）。
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <fieldset>
                  <legend className="text-xs font-medium text-zinc-400">理由</legend>
                  <ul className="mt-2 space-y-2">
                    {CONTENT_REPORT_REASONS.map((reason) => (
                      <li key={reason.code}>
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                          <input
                            type="radio"
                            name="report-reason"
                            value={reason.code}
                            checked={reasonCode === reason.code}
                            onChange={() => setReasonCode(reason.code)}
                            className="accent-violet-500"
                          />
                          {reason.label}
                        </label>
                      </li>
                    ))}
                  </ul>
                </fieldset>

                <label className="block text-xs text-zinc-500">
                  補足（任意）
                  <textarea
                    value={details}
                    onChange={(event) =>
                      setDetails(event.target.value.slice(0, DETAILS_MAX))
                    }
                    rows={3}
                    placeholder="具体的な状況があれば記入してください"
                    className="mt-1 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
                  />
                  <span className="mt-1 block text-right text-xs text-zinc-600">
                    {details.length}/{DETAILS_MAX}
                  </span>
                </label>

                {errorMessage ? (
                  <p className="text-sm text-rose-300">{errorMessage}</p>
                ) : null}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleSubmit()}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                  >
                    {submitting ? "送信中…" : "通報する"}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
