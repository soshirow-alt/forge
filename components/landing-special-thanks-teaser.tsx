import Link from "next/link";
import {
  SPECIAL_THANKS_PATH,
  SPECIAL_THANKS_PUBLIC_INTRO,
  formatSpecialThanksHandleDisplay,
  resolveSpecialThanksHref,
  type SpecialThanksEntry,
} from "@/lib/special-thanks";

/** Quiet LP teaser — published names only; no partner / endorsement framing. */
export function LandingSpecialThanksTeaser({
  entries,
}: {
  entries: SpecialThanksEntry[];
}) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-[1320px] px-6 pb-8 sm:px-8">
      <div className="border-t border-zinc-800/80 pt-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-medium text-zinc-400">Special Thanks</h2>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-zinc-600">
              {SPECIAL_THANKS_PUBLIC_INTRO}
            </p>
          </div>
          <Link
            href={SPECIAL_THANKS_PATH}
            className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            すべて見る
          </Link>
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-500">
          {entries.map((entry) => {
            const href = resolveSpecialThanksHref(entry);
            const handleDisplay = formatSpecialThanksHandleDisplay(entry.handle);
            const label = handleDisplay
              ? `${entry.displayName} ${handleDisplay}`
              : entry.displayName;
            return (
              <li key={entry.id}>
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-zinc-300"
                  >
                    {label}
                  </a>
                ) : (
                  <span>{label}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
