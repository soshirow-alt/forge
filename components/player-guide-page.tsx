"use client";

import Link from "next/link";
import { GuideStudioEntrySection } from "@/components/guide-studio-entry-section";
import { PlayerShell } from "@/components/player-shell";
import {
  firstGuideIntro,
  firstGuideSections,
  type FirstGuideCta,
} from "@/lib/player-guide-v0-content";

function CtaLink({ cta }: { cta: FirstGuideCta }) {
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

export function PlayerGuidePage() {
  return (
    <PlayerShell activeNav="guide">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {firstGuideIntro.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {firstGuideIntro.lead}
        </p>

        <ol className="mt-8 space-y-6">
          {firstGuideSections.map((section, index) => (
            <li key={section.id} id={section.id}>
              <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-sm font-bold text-violet-200 ring-1 ring-violet-500/30">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-white">
                      {section.title}
                    </h2>
                    <div className="mt-3 space-y-2">
                      {section.body.map((paragraph) => (
                        <p
                          key={paragraph}
                          className="text-sm leading-relaxed text-zinc-400"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    {section.bullets ? (
                      <ul className="mt-3 space-y-1.5">
                        {section.bullets.map((item) => (
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
                    {section.note ? (
                      <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                        {section.note}
                      </p>
                    ) : null}
                    {section.ctas && section.ctas.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {section.ctas.map((cta) => (
                          <CtaLink key={`${cta.href}:${cta.label}`} cta={cta} />
                        ))}
                      </div>
                    ) : null}
                    {section.id === "publish" ? (
                      <div className="mt-6 border-t border-zinc-800/80 pt-5">
                        <GuideStudioEntrySection embedded />
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            </li>
          ))}
        </ol>
      </div>
    </PlayerShell>
  );
}
