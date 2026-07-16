"use client";

import { useEffect, useState } from "react";
import { AutoGrowTextarea } from "@/components/auto-grow-textarea";
import { useAuth } from "@/components/auth-provider";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { FEEDBACK_REPLY_MAX } from "@/lib/feedback-free-text";
import { createClient } from "@/lib/supabase/client";
import {
  createFeedbackCardReply,
  deleteFeedbackCardReply,
  listFeedbackCardReplies,
  toggleFeedbackCardEmpathy,
  toggleFeedbackCardHelpful,
  type FeedbackCardReply,
} from "@/lib/supabase/feedback-card-engagement-db";
import type { PublicFeedbackCard } from "@/lib/public-feedback-cards";

type PublicFeedbackCardActionsProps = {
  projectId: string;
  card: PublicFeedbackCard;
  onCardChange: (card: PublicFeedbackCard) => void;
};

export function PublicFeedbackCardActions({
  projectId,
  card,
  onCardChange,
}: PublicFeedbackCardActionsProps) {
  const { user, authResolved } = useAuth();
  const { requireAuth } = useRequireAuth();
  const [threadOpen, setThreadOpen] = useState(false);
  const [replies, setReplies] = useState<FeedbackCardReply[] | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Logged-in + viewerCanEmpathy=false ⇒ own card (RPC denies self-empathy).
  // Logged-out ⇒ viewerCanEmpathy is also false; still show EntryGate CTA.
  const isOwnCard = Boolean(user) && !card.viewerCanEmpathy;
  const canToggleEmpathy = !user || card.viewerCanEmpathy;
  const showEmpathyControl = (() => {
    if (!authResolved) {
      // Avoid flash of disabled「共感 0」before session/viewer flags settle.
      return card.empathyCount > 0;
    }
    if (!user) {
      return true;
    }
    if (isOwnCard) {
      return card.empathyCount > 0;
    }
    return true;
  })();

  useEffect(() => {
    if (!threadOpen || replies !== null) {
      return;
    }
    const supabase = createClient();
    void listFeedbackCardReplies(supabase, projectId, card.versionKey, card.cardId)
      .then(setReplies)
      .catch(() => setReplies([]));
  }, [threadOpen, replies, projectId, card.versionKey, card.cardId]);

  async function handleEmpathy() {
    const run = async () => {
      setBusy(true);
      setError(null);
      try {
        const supabase = createClient();
        const result = await toggleFeedbackCardEmpathy(
          supabase,
          projectId,
          card.versionKey,
          card.cardId,
        );
        onCardChange({
          ...card,
          empathyCount: result.empathyCount,
          viewerHasEmpathy: result.viewerHasEmpathy,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "共感の更新に失敗しました");
      } finally {
        setBusy(false);
      }
    };

    if (!user) {
      requireAuth(run, `/games/${projectId}?tab=voices`);
      return;
    }
    if (!canToggleEmpathy) {
      return;
    }
    await run();
  }

  async function handleHelpful() {
    if (!card.viewerIsProjectOwner) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const result = await toggleFeedbackCardHelpful(
        supabase,
        projectId,
        card.versionKey,
        card.cardId,
      );
      onCardChange({
        ...card,
        developerMarkedHelpful: result.developerMarkedHelpful,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "参考になったの更新に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitReply() {
    const body = replyDraft.trim();
    if (!body || body.length > FEEDBACK_REPLY_MAX || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      await createFeedbackCardReply(
        supabase,
        projectId,
        card.versionKey,
        card.cardId,
        body,
      );
      setReplyDraft("");
      const next = await listFeedbackCardReplies(
        supabase,
        projectId,
        card.versionKey,
        card.cardId,
      );
      setReplies(next);
      onCardChange({ ...card, replyCount: next.length });
    } catch (err) {
      setError(err instanceof Error ? err.message : "返信の送信に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteReply(replyId: string) {
    if (!window.confirm("この返信を削除しますか？")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      await deleteFeedbackCardReply(supabase, replyId);
      const next = (replies ?? []).filter((reply) => reply.id !== replyId);
      setReplies(next);
      onCardChange({ ...card, replyCount: Math.max(0, card.replyCount - 1) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "返信の削除に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  const canOpenThread = card.replyCount > 0 || card.viewerCanReply;
  const replyLabel =
    card.replyCount > 0
      ? `返信 ${card.replyCount}件`
      : card.viewerCanReply
        ? "返信する"
        : null;

  return (
    <div className="mt-3 space-y-3" data-feedback-card-actions>
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {showEmpathyControl ? (
          canToggleEmpathy ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleEmpathy()}
              className={`rounded-md px-2 py-1 transition-colors disabled:opacity-50 ${
                card.viewerHasEmpathy
                  ? "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/30"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              共感 {card.empathyCount}
            </button>
          ) : (
            <span className="rounded-md px-2 py-1 text-zinc-500">
              共感 {card.empathyCount}
            </span>
          )
        ) : null}
        {canOpenThread && replyLabel ? (
          <button
            type="button"
            onClick={() => setThreadOpen((open) => !open)}
            className="rounded-md px-2 py-1 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
          >
            {replyLabel}
          </button>
        ) : null}
        {card.viewerIsProjectOwner ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleHelpful()}
            className={`rounded-md px-2 py-1 transition-colors disabled:opacity-50 ${
              card.developerMarkedHelpful
                ? "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            }`}
          >
            {card.developerMarkedHelpful ? "参考になった ✓" : "参考になった"}
          </button>
        ) : null}
      </div>

      {error ? <p className="text-[11px] text-red-300">{error}</p> : null}

      {threadOpen ? (
        <div className="space-y-3 rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3">
          {replies === null ? (
            <p className="text-[11px] text-zinc-600">返信を読み込み中…</p>
          ) : replies.length === 0 ? (
            <p className="text-[11px] text-zinc-600">まだ返信はありません。</p>
          ) : (
            <ul className="space-y-2.5">
              {replies.map((reply) => (
                <li key={reply.id} className="rounded-md border border-zinc-800/60 px-2.5 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-medium text-zinc-300">
                      {reply.authorDisplayName}
                      {reply.isDeveloper ? (
                        <span className="ml-1.5 rounded border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 text-[10px] text-violet-200">
                          開発者
                        </span>
                      ) : null}
                    </p>
                    {reply.isOwn ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleDeleteReply(reply.id)}
                        className="text-[10px] text-zinc-500 hover:text-red-300"
                      >
                        削除
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-200">{reply.body}</p>
                </li>
              ))}
            </ul>
          )}

          {card.viewerCanReply ? (
            <div>
              <AutoGrowTextarea
                rows={3}
                value={replyDraft}
                maxLength={FEEDBACK_REPLY_MAX}
                minHeightPx={72}
                maxHeightPx={200}
                placeholder="返信を書く"
                onChange={(event) => setReplyDraft(event.target.value)}
                className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/40 focus:outline-none"
              />
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <p className="text-[11px] text-zinc-600">
                  {replyDraft.length} / {FEEDBACK_REPLY_MAX}
                </p>
                <button
                  type="button"
                  disabled={busy || !replyDraft.trim()}
                  onClick={() => void handleSubmitReply()}
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-orange-500/40 hover:text-orange-300 disabled:opacity-50"
                >
                  送信
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
