"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import type { GameFeedbackItem } from "@/lib/game-feedback-storage";

const inputClassName =
  "w-full resize-y rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/40 focus:outline-none focus:ring-1 focus:ring-orange-500/30";

function hasDeepContent(item: {
  goodPoints?: string;
  concerns?: string;
  bugs?: string;
  otherNotes?: string;
}): boolean {
  return Boolean(
    item.goodPoints?.trim() ||
      item.concerns?.trim() ||
      item.bugs?.trim() ||
      item.otherNotes?.trim(),
  );
}

type GameDeepFeedbackFormProps = {
  gameId: string;
};

export function GameDeepFeedbackForm({ gameId }: GameDeepFeedbackFormProps) {
  const { user } = useAuth();
  const { getMyFeedbackForProject, submitProjectFeedback } = useGames();

  const [goodPoints, setGoodPoints] = useState("");
  const [concerns, setConcerns] = useState("");
  const [bugs, setBugs] = useState("");
  const [otherNotes, setOtherNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    void getMyFeedbackForProject(gameId)
      .then((item) => {
        if (item) {
          setGoodPoints(item.goodPoints ?? "");
          setConcerns(item.concerns ?? "");
          setBugs(item.bugs ?? "");
          setOtherNotes(item.otherNotes ?? "");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [gameId, user, getMyFeedbackForProject]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const feedback: Omit<
      GameFeedbackItem,
      "id" | "createdAt" | "versionKey" | "updatedAt"
    > = {
      goodPoints: goodPoints.trim() || undefined,
      concerns: concerns.trim() || undefined,
      bugs: bugs.trim() || undefined,
      otherNotes: otherNotes.trim() || undefined,
    };

    if (!hasDeepContent(feedback)) {
      return;
    }

    setSubmitting(true);
    setSaveError(null);
    try {
      await submitProjectFeedback(gameId, feedback);
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

  if (loading) {
    return <p className="text-xs text-zinc-600">詳しい感想フォームを読み込み中...</p>;
  }

  if (saved && !submitting) {
    return (
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3.5 py-3">
        <p className="text-xs text-zinc-500">詳しい感想を送信しました。</p>
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
        <label htmlFor={`good-${gameId}`} className="text-xs font-medium text-zinc-500">
          良かった点
        </label>
        <textarea
          id={`good-${gameId}`}
          rows={2}
          value={goodPoints}
          onChange={(event) => setGoodPoints(event.target.value)}
          className={`${inputClassName} mt-1.5`}
        />
      </div>
      <div>
        <label htmlFor={`concerns-${gameId}`} className="text-xs font-medium text-zinc-500">
          気になった点
        </label>
        <textarea
          id={`concerns-${gameId}`}
          rows={2}
          value={concerns}
          onChange={(event) => setConcerns(event.target.value)}
          className={`${inputClassName} mt-1.5`}
        />
      </div>
      <div>
        <label htmlFor={`bugs-${gameId}`} className="text-xs font-medium text-zinc-500">
          バグっぽい挙動
        </label>
        <textarea
          id={`bugs-${gameId}`}
          rows={2}
          value={bugs}
          onChange={(event) => setBugs(event.target.value)}
          className={`${inputClassName} mt-1.5`}
        />
      </div>
      <div>
        <label htmlFor={`other-${gameId}`} className="text-xs font-medium text-zinc-500">
          その他・自由に伝えたいこと
        </label>
        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-600">
          上の項目に当てはまらないこと、開発者へのメモなど（任意）
        </p>
        <textarea
          id={`other-${gameId}`}
          rows={3}
          value={otherNotes}
          onChange={(event) => setOtherNotes(event.target.value)}
          className={`${inputClassName} mt-1.5`}
          placeholder="例：このシーンの雰囲気が好きでした / 続編が楽しみです"
        />
      </div>
      {saveError && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200"
        >
          {saveError}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-orange-500/40 hover:text-orange-300 disabled:opacity-60"
      >
        {submitting ? "送信中..." : "詳しい感想を届ける"}
      </button>
    </form>
  );
}
