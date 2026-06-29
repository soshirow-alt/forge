"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { V0SimpleModal } from "@/components/v0-simple-modal";
import { useGames } from "@/components/games-provider";
import { gamePlayHref } from "@/lib/project-nurture-links";

type ProjectShareLinkModalProps = {
  projectId: string;
  open: boolean;
  onClose: () => void;
};

export function ProjectShareLinkModal({
  projectId,
  open,
  onClose,
}: ProjectShareLinkModalProps) {
  const { getSubmittedGameById } = useGames();
  const game = getSubmittedGameById(projectId);
  const [pageUrl, setPageUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      return;
    }

    const path = gamePlayHref(projectId);
    setPageUrl(
      typeof window !== "undefined" ? `${window.location.origin}${path}` : path,
    );
  }, [open, projectId]);

  const handleCopy = useCallback(async () => {
    if (!pageUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [pageUrl]);

  if (!open) {
    return null;
  }

  return (
    <V0SimpleModal
      title="リンクをコピー"
      subtitle={
        game
          ? `「${game.title}」の作品ページURLを、X や Discord などに貼り付けられます。`
          : "作品ページのURLを、X や Discord などに貼り付けられます。"
      }
      onClose={onClose}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="share-page-url" className="text-sm font-medium text-zinc-400">
            作品ページのURL
          </label>
          <input
            id="share-page-url"
            type="text"
            readOnly
            value={pageUrl}
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
          />
        </div>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
        >
          {copied ? (
            <>
              <Check className="size-4" aria-hidden="true" />
              URLをコピーしました
            </>
          ) : (
            <>
              <Copy className="size-4" aria-hidden="true" />
              URLをコピー
            </>
          )}
        </button>
        <p className="text-xs leading-relaxed text-zinc-600">
          プレイヤーがこのURLから作品を見つけ、フィードバックを届けられます。
        </p>
      </div>
    </V0SimpleModal>
  );
}
