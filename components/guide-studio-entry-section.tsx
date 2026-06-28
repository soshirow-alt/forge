import Image from "next/image";
import { playerGuideStudioEntry } from "@/lib/player-guide-v0-content";

export function GuideStudioEntrySection() {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-white">{playerGuideStudioEntry.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">{playerGuideStudioEntry.lead}</p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{playerGuideStudioEntry.body}</p>

      <figure className="mt-5 overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
        <div className="relative aspect-[16/10] max-h-72 w-full bg-zinc-950">
          <Image
            src={playerGuideStudioEntry.imageSrc}
            alt={playerGuideStudioEntry.imageAlt}
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 100vw, 672px"
          />
          <span
            className="pointer-events-none absolute right-3 top-3 rounded-lg border-2 border-violet-400 bg-violet-500/20 px-2 py-1 text-xs font-semibold text-violet-100 shadow-lg shadow-violet-500/30 sm:right-4 sm:top-4"
            aria-hidden="true"
          >
            Studio
          </span>
        </div>
        <figcaption className="border-t border-zinc-800/80 px-4 py-3 text-xs text-zinc-500 sm:px-5">
          {playerGuideStudioEntry.caption}
        </figcaption>
      </figure>
    </section>
  );
}
