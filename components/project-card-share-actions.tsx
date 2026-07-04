"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { ProjectShareLinkModal } from "@/components/project-share-link-modal";
import { gamePlayHref } from "@/lib/project-nurture-links";
import { isGamePublic } from "@/lib/project-visibility";
import type { Game } from "@/lib/mock-games";

const linkClassName =
  "inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-violet-300";

const shareButtonClassName =
  "inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-zinc-500";

type ProjectCardShareActionsProps = {
  game: Pick<Game, "id" | "title" | "visibility">;
  className?: string;
};

export function ProjectCardShareActions({ game, className }: ProjectCardShareActionsProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const isPublic = isGamePublic(game);
  const viewLabel = isPublic ? "公開ページを見る" : "確認用ページを見る";

  return (
    <>
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${className ?? ""}`}>
        <Link
          href={gamePlayHref(game.id)}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
        >
          <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
          {viewLabel}
        </Link>
        <button
          type="button"
          onClick={() => isPublic && setShareOpen(true)}
          disabled={!isPublic}
          title={
            isPublic
              ? undefined
              : "非公開のままでは外部に共有できません。作品情報を編集して公開してください。"
          }
          className={shareButtonClassName}
        >
          <Copy className="size-3 shrink-0" aria-hidden="true" />
          外部に共有する
        </button>
      </div>

      {isPublic ? (
        <ProjectShareLinkModal
          projectId={game.id}
          title={game.title}
          open={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      ) : null}
    </>
  );
}
