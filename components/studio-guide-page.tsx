"use client";

import Link from "next/link";
import { StudioShell } from "@/components/studio-shell";

const steps = [
  { label: "投稿", description: "最初の作品を登録する" },
  { label: "公開", description: "プレイ可能版を届ける" },
  { label: "声を見る", description: "届いた声を読み、材料にする" },
  { label: "改善する", description: "次の版で何を直すか決める" },
  { label: "新版公開", description: "Devlog で変化を伝える" },
  { label: "正式版公開", description: "育てた記録の区切りとして Released に" },
] as const;

export function StudioGuidePage() {
  return (
    <StudioShell activeNav="guide">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-white">はじめてガイド</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Forge の育成サイクル — ゲームを短いサイクルで育て、声を活かし、正式版へつなげます。
        </p>

        <ol className="mt-8 space-y-0">
          {steps.map((step, index) => (
            <li key={step.label} className="relative flex gap-4 pb-8 last:pb-0">
              {index < steps.length - 1 && (
                <span
                  className="absolute left-4 top-10 h-[calc(100%-2rem)] w-px bg-zinc-800"
                  aria-hidden="true"
                />
              )}
              <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-sm font-bold text-violet-200 ring-1 ring-violet-500/30">
                {index + 1}
              </span>
              <div className="pt-0.5">
                <p className="font-semibold text-zinc-200">{step.label}</p>
                <p className="mt-1 text-sm text-zinc-500">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/submit"
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
          >
            最初の作品を投稿
          </Link>
          <Link
            href="/studio/projects"
            className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-600"
          >
            プロジェクト一覧へ
          </Link>
        </div>
      </div>
    </StudioShell>
  );
}
