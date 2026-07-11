/** Studio 右パネル — 左プレビューと差別化した操作エリア用（黒×紫） */

export const studioOperationPanelAsideClassName =
  "w-full min-w-0 shrink-0 xl:sticky xl:top-6 xl:w-[360px] xl:max-w-[360px] xl:self-start";

export const studioOperationPanelScrollClassName =
  "flex max-h-[calc(100vh-1.5rem)] w-full min-w-0 max-w-full flex-col overflow-hidden";

/** 本文はここだけが縦スクロール。横は隠す。薄いスクロールバー。 */
export const studioOperationPanelScrollBodyClassName =
  "forge-thin-scrollbar min-h-0 min-w-0 w-full max-w-full flex-1 overflow-y-auto overflow-x-hidden";

export const studioOperationPanelGuidanceClassName =
  "w-full min-w-0 max-w-full break-words rounded-lg border border-violet-500/15 bg-violet-500/5 px-3 py-2.5 text-xs leading-relaxed text-zinc-500";

export const studioOperationPanelOuterClassName =
  "w-full min-w-0 max-w-full box-border rounded-2xl border border-violet-500/25 bg-zinc-900/75 px-4 py-4 shadow-sm shadow-violet-500/10";

export const studioOperationPanelHeaderAccentClassName =
  "w-full min-w-0 max-w-full box-border rounded-xl border border-violet-500/15 bg-gradient-to-br from-violet-500/12 via-violet-500/6 to-transparent px-3 py-3";

/** カテゴリ内の枠付きブロック（編集シェル等）。アクション行リストでは使わない */
export const studioOperationPanelBlockClassName =
  "w-full min-w-0 max-w-full box-border rounded-xl border border-violet-500/12 bg-zinc-900/55 p-4";

/** クリック不可のカテゴリ見出し（枠なし） */
export const studioOperationPanelGroupLabelClassName =
  "text-[11px] font-medium tracking-wide text-zinc-500";

/** 編集シェル自体はスクロールしない（親の ScrollBody に任せる） */
export const studioOperationEditShellClassName =
  "w-full min-w-0 max-w-full box-border rounded-xl border border-violet-500/15 bg-zinc-900/60 p-4";

export const studioOperationPrimaryButtonClassName =
  "inline-flex w-full min-w-0 max-w-full box-border items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50";
