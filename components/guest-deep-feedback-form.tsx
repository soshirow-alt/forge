"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { FeedbackPublicDisplayConsent } from "@/components/feedback-public-display-consent";
import { postGuestFeedback } from "@/lib/guest-feedback/client";
import type { GuestDetailedFeedbackInput } from "@/lib/guest-feedback/types";
import { resolvePlayableVersion } from "@/lib/playable-version";

const inputClassName =
  "w-full resize-y rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/40 focus:outline-none focus:ring-1 focus:ring-orange-500/30";

function hasDeepContent(input: GuestDetailedFeedbackInput): boolean {
  return Boolean(
    input.goodPoints?.trim() ||
      input.concerns?.trim() ||
      input.bugs?.trim() ||
      input.otherNotes?.trim(),
  );
}

type GuestDeepFeedbackFormProps = {
  gameId: string;
  playableVersion: string;
  loginHref?: string;
};

export function GuestDeepFeedbackForm({
  gameId,
  playableVersion,
  loginHref,
}: GuestDeepFeedbackFormProps) {
  const versionKey = resolvePlayableVersion(playableVersion);
  const [goodPoints, setGoodPoints] = useState("");
  const [concerns, setConcerns] = useState("");
  const [bugs, setBugs] = useState("");
  const [otherNotes, setOtherNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [publicDisplayConsent, setPublicDisplayConsent] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: GuestDetailedFeedbackInput = {
      versionKey,
      goodPoints: goodPoints.trim() || undefined,
      concerns: concerns.trim() || undefined,
      bugs: bugs.trim() || undefined,
      otherNotes: otherNotes.trim() || undefined,
    };

    if (!hasDeepContent(payload) || !publicDisplayConsent) {
      return;
    }

    setSubmitting(true);
    setSaveError(null);
    try {
      await postGuestFeedback(gameId, payload);
      setSaved(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "保存に失敗しました。時間をおいて再度お試しください。";
      setSaveError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (saved && !submitting) {
    return (
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3.5 py-3">
        <p className="text-xs text-zinc-500">ゲストとして詳しい感想を開発者に届けました。</p>
        <button
          type="button"
          onClick={() => setSaved(false)}
          className="mt-2 text-xs font-medium text-orange-400/90 hover:text-orange-300"
        >
          編集を続ける
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-zinc-800/60 bg-zinc-950/30 p-4"
    >
      <p className="text-xs text-zinc-600">
        任意です。書かなくても、質問への回答はすでに送信済みです。
      </p>
      <div>
        <label htmlFor={`guest-good-${gameId}`} className="text-xs font-medium text-zinc-500">
          良かった点
        </label>
        <textarea
          id={`guest-good-${gameId}`}
          rows={2}
          value={goodPoints}
          onChange={(event) => setGoodPoints(event.target.value)}
          className={`${inputClassName} mt-1.5`}
        />
      </div>
      <div>
        <label htmlFor={`guest-concerns-${gameId}`} className="text-xs font-medium text-zinc-500">
          気になった点
        </label>
        <textarea
          id={`guest-concerns-${gameId}`}
          rows={2}
          value={concerns}
          onChange={(event) => setConcerns(event.target.value)}
          className={`${inputClassName} mt-1.5`}
        />
      </div>
      <div>
        <label htmlFor={`guest-bugs-${gameId}`} className="text-xs font-medium text-zinc-500">
          バグっぽい挙動
        </label>
        <textarea
          id={`guest-bugs-${gameId}`}
          rows={2}
          value={bugs}
          onChange={(event) => setBugs(event.target.value)}
          className={`${inputClassName} mt-1.5`}
        />
      </div>
      <div>
        <label htmlFor={`guest-other-${gameId}`} className="text-xs font-medium text-zinc-500">
          その他・自由に伝えたいこと
        </label>
        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-600">
          上の項目に当てはまらないこと、開発者へのメモなど（任意）
        </p>
        <textarea
          id={`guest-other-${gameId}`}
          rows={3}
          value={otherNotes}
          onChange={(event) => setOtherNotes(event.target.value)}
          className={`${inputClassName} mt-1.5`}
          placeholder="例：このシーンの雰囲気が好きでした / 続編が楽しみです"
        />
      </div>
      {saveError ? (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200"
        >
          {saveError}
        </p>
      ) : null}
      <FeedbackPublicDisplayConsent
        idPrefix={`guest-deep-${gameId}`}
        checked={publicDisplayConsent}
        onCheckedChange={setPublicDisplayConsent}
      />
      <button
        type="submit"
        disabled={submitting || !publicDisplayConsent}
        className="rounded-lg border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-orange-500/40 hover:text-orange-300 disabled:opacity-60"
      >
        {submitting ? "送信中..." : "詳しい感想を届ける"}
      </button>
      {loginHref ? (
        <p className="text-[11px] leading-relaxed text-zinc-600">
          <Link href={loginHref} className="text-orange-400/90 hover:text-orange-300">
            ログイン
          </Link>
          すると、今後のプレイや感想を自分の履歴に残せます。ゲストとして送った内容がログイン後に引き継がれることはありません。
        </p>
      ) : null}
    </form>
  );
}
