"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
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
  const isOwnCard = Boolean(user) && !card.viewerCanEmpathy;
  const hasEmpathy = card.viewerHasEmpathy;
  // Own cards: never show empathy control. Before auth settles: hide (no「共感 0」flash).
  const showEmpathyControl = authResolved && !isOwnCard;

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
    if (hasEmpathy || busy) {
      return;
    }

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
        if (result.viewerHasEmpathy) {
          onCardChange({
            ...card,
            empathyCount: result.empathyCount,
            viewerHasEmpathy: true,
            viewerCanEmpathy: true,
          });
          return;
        }
        // Race: existing toggle RPC flipped off — re-apply once (UI is one-way).
        const again = await toggleFeedbackCardEmpathy(
          supabase,
          projectId,
          card.versionKey,
          card.cardId,
        );
        onCardChange({
          ...card,
          empathyCount: again.empathyCount,
          viewerHasEmpathy: again.viewerHasEmpathy,
          viewerCanEmpathy: true,
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
    if (!card.viewerCanEmpathy) {
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
      setError(err instanceof Error ? err.message : "開発の参考になったの更新に失敗しました");
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
          <button
            type="button"
            disabled={busy || hasEmpathy}
            onClick={() => void handleEmpathy()}
            aria-pressed={hasEmpathy}
            aria-label={
              hasEmpathy
                ? `共感済み ${card.empathyCount}`
                : `共感 ${card.empathyCount}`
            }
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-default ${
              hasEmpathy
                ? "border border-pink-400/40 bg-pink-500/20 text-pink-200 disabled:opacity-100"
                : "border border-pink-500/45 bg-pink-500/15 text-pink-200 hover:border-pink-400/70 hover:bg-pink-500/25 hover:text-pink-100"
            }`}
          >
            <Heart
              className={`size-4 shrink-0 ${hasEmpathy ? "fill-pink-300 text-pink-300" : "text-pink-300"}`}
              aria-hidden="true"
            />
            <span>{hasEmpathy ? "共感済み" : "共感"}</span>
            <span className="tabular-nums opacity-90">{card.empathyCount}</span>
          </button>
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
            aria-pressed={card.developerMarkedHelpful}
            className={`rounded-md px-2 py-1 transition-colors disabled:opacity-50 ${
              card.developerMarkedHelpful
                ? "bg-violet-500/15 font-medium text-violet-300 ring-1 ring-violet-500/30"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            }`}
          >
            {card.developerMarkedHelpful
              ? "★ 開発の参考になった"
              : "☆ 開発の参考になった"}
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
