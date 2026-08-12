"use client";

import Link from "next/link";
import { StudioShell } from "@/components/studio-shell";
import { studioSubmitModalHref } from "@/lib/project-nurture-links";
import {
  studioGuideIntro,
  studioGuideSteps,
  type StudioGuideCta,
} from "@/lib/studio-guide-v0-content";
import { STUDIO_HOME_DEV_HINTS } from "@/lib/studio-home-metrics";

function CtaLink({ cta }: { cta: StudioGuideCta }) {
  const className =
    cta.kind === "primary"
      ? "rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
      : "rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-600";
  return (
    <Link href={cta.href} className={className}>
      {cta.label}
    </Link>
  );
}

export function StudioGuidePage() {
  return (
    <StudioShell activeNav="guide">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {studioGuideIntro.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {studioGuideIntro.lead} はじめての人は Player の{" "}
          <Link href="/guide" className="text-violet-400 hover:text-violet-300">
            {studioGuideIntro.playerGuideLabel}
          </Link>
          もどうぞ。
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-400">
            {studioGuideIntro.rolePlayer}
          </span>
          <span className="rounded-full border border-violet-500/30 bg-violet-600/10 px-3 py-1 text-xs text-violet-200">
            {studioGuideIntro.roleStudio}
          </span>
        </div>

        <ol className="mt-8 space-y-5">
          {studioGuideSteps.map((step, index) => (
            <li key={step.id} id={step.id}>
              <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-sm font-bold text-violet-200 ring-1 ring-violet-500/30">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-white">
                      {step.title}
                    </h2>
                    <div className="mt-3 space-y-2">
                      {step.body.map((paragraph) => (
                        <p
                          key={paragraph}
                          className="text-sm leading-relaxed text-zinc-400"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    {step.chips ? (
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {step.chips.map((chip) => (
                          <li
                            key={chip}
                            className="rounded-full border border-violet-500/30 bg-violet-600/15 px-2.5 py-1 text-xs font-medium text-violet-200"
                          >
                            {chip}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {step.bullets ? (
                      <ul className="mt-3 space-y-1.5">
                        {step.bullets.map((item) => (
                          <li
                            key={item}
                            className="text-sm leading-relaxed text-zinc-300"
                          >
                            <span className="mr-2 text-violet-400/80">·</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {step.note ? (
                      <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                        {step.note}
                      </p>
                    ) : null}
                    {step.ctas && step.ctas.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {step.ctas.map((cta) => (
                          <CtaLink key={`${cta.href}:${cta.label}`} cta={cta} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
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
            新規投稿
          </Link>
          <Link
            href="/studio/messages"
            className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-600"
          >
            メッセージ
          </Link>
          <Link
            href="/studio/mypage"
            className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-600"
          >
            作品一覧
          </Link>
        </div>
      </div>
    </StudioShell>
  );
}
