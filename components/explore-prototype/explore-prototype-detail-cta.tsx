"use client";

import { useEffect, useState } from "react";
import {
  getExplorePrototypeCtaLabel,
  type ExplorePrototypeCategorySlug,
} from "@/lib/prototype/explore-prototype";

const CTA_TOAST: Record<ExplorePrototypeCategorySlug, string> = {
  game: "プレイ先への接続は次の工程で実装します",
  audio: "再生機能は次の工程で実装します",
  "dev-tool": "利用先への接続は次の工程で実装します",
  "service-app": "サービスへの接続は次の工程で実装します",
};

const FB_TOAST = "フィードバック投稿は次の工程で実装します";

export function ExplorePrototypeDetailPrimaryCta({
  category,
  title,
}: {
  category: ExplorePrototypeCategorySlug;
  title: string;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const label = getExplorePrototypeCtaLabel(category);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <>
      <button
        type="button"
        onClick={() => setToast(CTA_TOAST[category])}
        aria-label={`${title}を${label}`}
        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-white px-4 text-sm font-medium text-zinc-950 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      >
        {label}
      </button>
      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}

export function ExplorePrototypeFeedbackProtoButton() {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <>
      <button
        type="button"
        onClick={() => setToast(FB_TOAST)}
        className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-violet-500/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      >
        フィードバックを届ける
      </button>
      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
