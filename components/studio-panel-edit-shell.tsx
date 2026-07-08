"use client";

import type { ReactNode } from "react";
import { studioOperationEditShellClassName } from "@/lib/studio-operation-panel-styles";

const cancelButtonClassName =
  "inline-flex min-w-0 flex-1 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800/80 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50";

const saveButtonClassName =
  "inline-flex min-w-0 flex-1 items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-2 text-sm font-semibold text-zinc-950 shadow-sm shadow-orange-500/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

const backBarClassName =
  "inline-flex w-full max-w-full min-w-0 box-border items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-950/70 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-orange-500/35 hover:bg-zinc-900/90 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50";

export type StudioPanelEditShellProps = {
  title: string;
  onCancel: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  saveError?: string | null;
  validationError?: string | null;
  children: ReactNode;
  footerNote?: ReactNode;
  hideSave?: boolean;
  saveLabel?: string;
  backLabel?: string;
};

/**
 * 編集フォーム本体。縦スクロールは持たない。
 * 親の Studio 右パネル ScrollBody が唯一の縦スクロールになる。
 */
export function StudioPanelEditShell({
  title,
  onCancel,
  onSave,
  isSaving = false,
  saveError = null,
  validationError = null,
  children,
  footerNote,
  hideSave = false,
  saveLabel = "保存",
  backLabel = "← 概要に戻る",
}: StudioPanelEditShellProps) {
  return (
    <section
      aria-label={title}
      className={`w-full min-w-0 max-w-full ${studioOperationEditShellClassName}`}
    >
      <button
        type="button"
        onClick={onCancel}
        disabled={isSaving}
        className={backBarClassName}
      >
        {backLabel}
      </button>

      <h3 className="mt-3 break-words text-sm font-semibold text-zinc-100">{title}</h3>

      {validationError ? (
        <p
          role="alert"
          className="mt-3 w-full min-w-0 max-w-full break-words rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200"
        >
          {validationError}
        </p>
      ) : null}

      {saveError ? (
        <p
          role="alert"
          className="mt-3 w-full min-w-0 max-w-full break-words rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200"
        >
          {saveError}
        </p>
      ) : null}

      <div className="mt-4 w-full min-w-0 max-w-full space-y-4">{children}</div>

      {footerNote ? <div className="mt-3 w-full min-w-0 max-w-full">{footerNote}</div> : null}

      <div className="sticky bottom-0 z-10 mt-4 flex w-full min-w-0 max-w-full shrink-0 box-border gap-2 border-t border-zinc-800/80 bg-zinc-900/95 pt-3">
        <button type="button" onClick={onCancel} disabled={isSaving} className={cancelButtonClassName}>
          {hideSave ? "戻る" : "キャンセル"}
        </button>
        {hideSave || !onSave ? null : (
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className={saveButtonClassName}
          >
            {isSaving ? "保存中…" : saveLabel}
          </button>
        )}
      </div>
    </section>
  );
}

export const studioPanelInputClassName =
  "mt-1.5 box-border w-full max-w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50";
