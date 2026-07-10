import Link from "next/link";
import { Flame } from "lucide-react";
import type { ReactNode } from "react";
import { PRIVACY_PATH, TERMS_PATH } from "@/lib/legal-routes";
import { SPECIAL_THANKS_PATH } from "@/lib/special-thanks";

export function LegalDocumentShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/80 px-6 py-4 lg:px-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-white/90 text-zinc-950">
              <Flame className="size-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold tracking-tight text-white">Forge</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
            <Link href={TERMS_PATH} className="transition-colors hover:text-zinc-300">
              利用規約
            </Link>
            <Link href={PRIVACY_PATH} className="transition-colors hover:text-zinc-300">
              プライバシーポリシー
            </Link>
            <Link
              href={SPECIAL_THANKS_PATH}
              className="transition-colors hover:text-zinc-300"
            >
              Special Thanks
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 lg:px-10 lg:py-14">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        <article className="legal-prose mt-8">{children}</article>
      </main>

      <footer className="border-t border-zinc-800/80 px-6 py-5 text-xs text-zinc-500 lg:px-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Forge. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href={TERMS_PATH} className="transition-colors hover:text-zinc-300">
              利用規約
            </Link>
            <Link href={PRIVACY_PATH} className="transition-colors hover:text-zinc-300">
              プライバシーポリシー
            </Link>
            <Link
              href={SPECIAL_THANKS_PATH}
              className="transition-colors hover:text-zinc-300"
            >
              Special Thanks
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
