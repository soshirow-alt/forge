import Link from "next/link";
import {
  SPECIAL_THANKS_PATH,
  SPECIAL_THANKS_PUBLIC_INTRO,
  formatSpecialThanksHandleDisplay,
  resolveSpecialThanksHref,
  type SpecialThanksEntry,
} from "@/lib/special-thanks";

function SpecialThanksEntryLine({ entry }: { entry: SpecialThanksEntry }) {
  const handleDisplay = formatSpecialThanksHandleDisplay(entry.handle);
  const href = resolveSpecialThanksHref(entry);
  const name = (
    <span className="font-medium text-zinc-200">{entry.displayName}</span>
  );

  return (
    <li className="border-b border-zinc-800/80 py-4 last:border-b-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-white"
          >
            {name}
          </a>
        ) : (
          name
        )}
        {handleDisplay ? (
          <span className="text-sm text-zinc-500">{handleDisplay}</span>
        ) : null}
        {entry.roleLabel ? (
          <span className="text-sm text-zinc-500">{entry.roleLabel}</span>
        ) : null}
      </div>
      {entry.note ? (
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{entry.note}</p>
      ) : null}
    </li>
  );
}

export function SpecialThanksPublicPage({
  entries,
}: {
  entries: SpecialThanksEntry[];
}) {
  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/80 px-6 py-4 lg:px-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/" className="text-lg font-bold tracking-tight text-white">
            Forge
          </Link>
          <Link
            href="/"
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
          >
            トップへ
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 lg:px-10 lg:py-14">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Special Thanks
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
          {SPECIAL_THANKS_PUBLIC_INTRO}
        </p>

        {entries.length === 0 ? (
          <p className="mt-10 text-sm text-zinc-500">まだ掲載はありません。</p>
        ) : (
          <ul className="mt-10">
            {entries.map((entry) => (
              <SpecialThanksEntryLine key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </main>

      <footer className="border-t border-zinc-800/80 px-6 py-5 text-xs text-zinc-500 lg:px-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Forge. All rights reserved.</p>
          <Link
            href={SPECIAL_THANKS_PATH}
            className="transition-colors hover:text-zinc-300"
          >
            Special Thanks
          </Link>
        </div>
      </footer>
    </div>
  );
}
