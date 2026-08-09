"use client";

import { StudioPreviewEditTarget } from "@/components/studio-preview-edit-target";
import type { GameDetailPlayerMeta } from "@/lib/game-detail-player-meta";
import type { StudioPreviewEditTarget as StudioPreviewEditTargetId } from "@/lib/studio-preview-edit-targets";

function MetaBadge({
  label,
  emoji,
  tone,
}: {
  label: string;
  emoji?: string;
  tone: "completed" | "reopened" | "phase" | "play-access";
}) {
  const toneClass =
    tone === "completed"
      ? "border-amber-500/35 bg-amber-500/10 text-amber-200"
      : tone === "reopened"
        ? "border-sky-500/35 bg-sky-500/10 text-sky-200"
        : tone === "play-access"
          ? "border-zinc-600/60 bg-zinc-900/60 text-zinc-300"
          : "border-violet-500/35 bg-violet-500/10 text-violet-200";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${toneClass}`}
    >
      {emoji ? <span aria-hidden="true">{emoji}</span> : null}
      {label}
    </span>
  );
}

export function GameDetailPhaseBadge({
  meta,
  muted = false,
  onEditTarget,
  showPlayAccessBadge = true,
}: {
  meta: GameDetailPlayerMeta;
  muted?: boolean;
  onEditTarget?: (target: StudioPreviewEditTargetId) => void;
  /** Asset common-fields: hide free/paid play-access badge + its edit target. */
  showPlayAccessBadge?: boolean;
}) {
  const releaseBadge =
    meta.releaseBadgeLabel ? (
      <StudioPreviewEditTarget target="already-released" onEditTarget={onEditTarget} inline>
        <MetaBadge
          label={meta.releaseBadgeLabel}
          emoji={meta.releaseBadgeEmoji}
          tone={meta.releaseBadgeTone ?? "completed"}
        />
      </StudioPreviewEditTarget>
    ) : null;

  const playAccessBadge =
    showPlayAccessBadge && meta.playAccessBadgeLabel ? (
    <StudioPreviewEditTarget target="play-access" onEditTarget={onEditTarget} inline>
      <MetaBadge label={meta.playAccessBadgeLabel} tone="play-access" />
    </StudioPreviewEditTarget>
  ) : null;

  const phaseBadge = meta.phaseLabel ? (
    <StudioPreviewEditTarget target="phase" onEditTarget={onEditTarget} inline>
      <span
        className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
          muted || meta.releaseBadgeLabel
            ? "border-zinc-700/60 bg-zinc-900/50 text-zinc-500"
            : "border-violet-500/35 bg-violet-500/10 text-violet-200"
        }`}
      >
        {meta.phaseLabel}
      </span>
    </StudioPreviewEditTarget>
  ) : null;

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {releaseBadge}
      {playAccessBadge}
      {phaseBadge}
    </span>
  );
}
