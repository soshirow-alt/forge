"use client";

import Link from "next/link";
import { StudioShell } from "@/components/studio-shell";
import { studioSubmitModalHref } from "@/lib/project-nurture-links";
import { STUDIO_HOME_DEV_HINTS } from "@/lib/studio-home-metrics";

const steps = [
  { label: "投稿", description: "最初の作品を登録する" },
  { label: "公開", description: "プレイ可能verを届ける" },
  { label: "フィードバックを見る", description: "届いたフィードバックを読み、材料にする" },
  { label: "改善する", description: "次のverで何を直すか決める" },
  { label: "新ver公開", description: "開発ログで変化を伝える" },
  { label: "正式版公開", description: "育てた記録の区切りとして Released に" },
] as const;

export function StudioGuidePage() {
  return (
    <StudioShell activeNav="guide">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-white">はじめてガイド</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Studio の育成サイクル — 作品を短いサイクルで育て、フィードバックを活かし、正式版へつなげます。はじめての人は Player の{" "}
          <Link href="/guide" className="text-violet-400 hover:text-violet-300">
            はじめてガイド
          </Link>
          もどうぞ。
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

        <section className="mt-12 space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-white">開発ヒント</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Studio ホームのカードからも辿れます。
            </p>
          </div>
          {STUDIO_HOME_DEV_HINTS.map((card) => (
            <article
              key={card.id}
              id={card.id}
              className="scroll-mt-24 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6"
            >
              <h3 className="text-base font-semibold text-white">{card.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">{card.lead}</p>
              <ul className="mt-4 space-y-2">
                {card.tips.map((tip) => (
                  <li key={tip} className="text-sm text-zinc-400">
                    · {tip}
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-2 border-t border-zinc-800/80 pt-4">
                {card.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-relaxed text-zinc-500">
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href={studioSubmitModalHref()}
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
          >
            最初の作品を投稿
          </Link>
          <Link
            href="/studio/mypage"
            className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-600"
          >
            プロジェクト一覧へ
          </Link>
        </div>
      </div>
    </StudioShell>
  );
}
