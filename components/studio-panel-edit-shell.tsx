"use client";

import type { ReactNode } from "react";

const cancelButtonClassName =
  "inline-flex flex-1 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800/80 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50";

const saveButtonClassName =
  "inline-flex flex-1 items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-2 text-sm font-semibold text-zinc-950 shadow-sm shadow-orange-500/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

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
  backLabel = "← 公開ページを編集",
}: StudioPanelEditShellProps) {
  return (
    <section
      aria-label={title}
      className="rounded-xl border border-zinc-800/50 bg-zinc-950/25 p-4"
    >
      <button
        type="button"
        onClick={onCancel}
        disabled={isSaving}
        className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {backLabel}
      </button>

      <h3 className="mt-3 text-sm font-semibold text-zinc-200">{title}</h3>

      {validationError ? (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200"
        >
          {validationError}
        </p>
      ) : null}

      {saveError ? (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200"
        >
          {saveError}
        </p>
      ) : null}

      <div className="mt-4 space-y-4">{children}</div>

      {footerNote ? <div className="mt-3">{footerNote}</div> : null}

      <div className={`mt-4 flex gap-2`}>
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
  "mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50";
