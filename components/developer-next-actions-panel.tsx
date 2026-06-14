"use client";

import Link from "next/link";
import type { DeveloperNextAction } from "@/lib/developer-next-actions";

const primaryButtonClassName =
  "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90";

const secondaryButtonClassName =
  "inline-flex items-center justify-center rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-orange-500/50 hover:text-orange-400";

type DeveloperNextActionsPanelProps = {
  actions: DeveloperNextAction[];
  loaded: boolean;
};

function actionAccent(kind: DeveloperNextAction["kind"]): string {
  switch (kind) {
    case "latest_feedback":
    case "feedback_pending":
      return "border-orange-500/40 bg-orange-500/5";
    case "feedback_summary":
      return "border-orange-500/30 bg-orange-500/10";
    default:
      return "border-zinc-800 bg-zinc-900/80";
  }
}

export function DeveloperNextActionsPanel({
  actions,
  loaded,
}: DeveloperNextActionsPanelProps) {
  if (!loaded) {
    return (
      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">次にやること</h2>
        <p className="mt-2 text-sm text-zinc-500">読み込み中...</p>
      </section>
    );
  }

  if (actions.length === 0) {
    return null;
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold tracking-tight">次にやること</h2>
      <p className="mt-1 text-sm text-zinc-500">
        プレイヤーからのフィードバックを改善につなげるための次の一手です。
      </p>

      <div className="mt-6 space-y-3">
        {actions.map((action) => (
          <article
            key={action.id}
            className={`rounded-xl border p-5 ${actionAccent(action.kind)}`}
          >
            <h3 className="font-semibold text-zinc-100">{action.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {action.description}
            </p>
            {action.kind === "latest_feedback" && (
              <p className="mt-2 text-xs text-zinc-500">
                開発ログの「版公開」チェックでプレイ可能版を更新できます。
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {action.primaryHref.startsWith("#") ? (
                <a href={action.primaryHref} className={primaryButtonClassName}>
                  {action.primaryLabel}
                </a>
              ) : (
                <Link href={action.primaryHref} className={primaryButtonClassName}>
                  {action.primaryLabel}
                </Link>
              )}
              {action.secondaryHref && action.secondaryLabel && (
                <>
                  {action.secondaryHref.startsWith("#") ? (
                    <a
                      href={action.secondaryHref}
                      className={secondaryButtonClassName}
                    >
                      {action.secondaryLabel}
                    </a>
                  ) : (
                    <Link
                      href={action.secondaryHref}
                      className={secondaryButtonClassName}
                    >
                      {action.secondaryLabel}
                    </Link>
                  )}
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
