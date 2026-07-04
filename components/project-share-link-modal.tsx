"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { V0SimpleModal } from "@/components/v0-simple-modal";
import { useGames } from "@/components/games-provider";
import {
  buildProjectShareIntroText,
  getClientProjectPageUrl,
  openXComposeInNewTab,
} from "@/lib/project-share";

type ProjectShareLinkModalProps = {
  projectId: string;
  /** Prefer explicit title right after submit (catalog may lag). */
  title?: string;
  open: boolean;
  onClose: () => void;
};

type CopyFeedback = "intro" | "link" | null;

const actionButtonClassName =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-100 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-white";

const primaryActionButtonClassName =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90";

export function ProjectShareLinkModal({
  projectId,
  title: titleProp,
  open,
  onClose,
}: ProjectShareLinkModalProps) {
  const { getSubmittedGameById, getGameById } = useGames();
  const game =
    getSubmittedGameById(projectId) ?? getGameById(projectId);
  const title = titleProp?.trim() || game?.title?.trim() || "作品";

  const [pageUrl, setPageUrl] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback>(null);

  useEffect(() => {
    if (!open) {
      setCopyFeedback(null);
      return;
    }
    setPageUrl(getClientProjectPageUrl(projectId));
  }, [open, projectId]);

  const showCopyFeedback = useCallback((kind: Exclude<CopyFeedback, null>) => {
    setCopyFeedback(kind);
    window.setTimeout(() => setCopyFeedback(null), 2000);
  }, []);

  const handleOpenX = useCallback(() => {
    if (!pageUrl) {
      return;
    }
    openXComposeInNewTab(title, pageUrl);
  }, [pageUrl, title]);

  const handleCopyIntro = useCallback(async () => {
    if (!pageUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(
        buildProjectShareIntroText(title, pageUrl),
      );
      showCopyFeedback("intro");
    } catch {
      /* clipboard unavailable */
    }
  }, [pageUrl, showCopyFeedback, title]);

  const handleCopyLink = useCallback(async () => {
    if (!pageUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(pageUrl);
      showCopyFeedback("link");
    } catch {
      /* clipboard unavailable */
    }
  }, [pageUrl, showCopyFeedback]);

  if (!open) {
    return null;
  }

  return (
    <V0SimpleModal title="外部に共有する" onClose={onClose} size="md">
      <div className="space-y-5">
        <section className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            投稿する
          </h3>
          <button
            type="button"
            onClick={handleOpenX}
            className={primaryActionButtonClassName}
          >
            <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
            Xで投稿画面を開く
          </button>
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            コピーする
          </h3>
          <button
            type="button"
            onClick={() => void handleCopyIntro()}
            className={actionButtonClassName}
          >
            {copyFeedback === "intro" ? (
              <>
                <Check className="size-4 shrink-0 text-emerald-400" aria-hidden="true" />
                コピーしました
              </>
            ) : (
              <>
                <Copy className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                紹介文とリンクをコピー
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className={actionButtonClassName}
          >
            {copyFeedback === "link" ? (
              <>
                <Check className="size-4 shrink-0 text-emerald-400" aria-hidden="true" />
                リンクをコピーしました
              </>
            ) : (
              <>
                <Copy className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                リンクだけコピー
              </>
            )}
          </button>
        </section>
      </div>
    </V0SimpleModal>
  );
}
