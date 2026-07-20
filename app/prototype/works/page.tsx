import Link from "next/link";
import { PlayerShell } from "@/components/player-shell";
import {
  CATEGORY_SHELF_WORKS,
  DOMAIN_EXPANSION_PROTO_BANNER,
  WORK_CATEGORY_NAV,
  type WorkCategoryId,
} from "@/lib/prototype/domain-expansion";

export const metadata = {
  title: "カテゴリ抜粋 — Forge",
  robots: { index: false, follow: false },
};

function isWorkCategoryId(value: string | undefined): value is WorkCategoryId {
  return (
    value === "game" ||
    value === "music" ||
    value === "dev_tool" ||
    value === "web_service"
  );
}

export default async function PrototypeWorksCategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: raw } = await searchParams;
  const category = isWorkCategoryId(raw) ? raw : "music";
  const nav = WORK_CATEGORY_NAV.find((item) => item.id === category);
  const works = CATEGORY_SHELF_WORKS[category];

  return (
    <PlayerShell activeNav="home">
      <div className="mx-auto max-w-3xl space-y-6">
        <p className="rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-xs text-violet-200">
          {DOMAIN_EXPANSION_PROTO_BANNER}
        </p>
        <header>
          <p className="text-xs font-medium text-violet-300">カテゴリ入口（仮）</p>
          <h1 className="mt-1 text-2xl font-bold text-white">
            {nav?.label ?? "作品"}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">{nav?.shortAction}</p>
        </header>
        <ul className="space-y-3">
          {works.map((work) => (
            <li key={work.id}>
              <Link
                href={`/prototype/works/${work.slug}`}
                className="block rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 transition-colors hover:border-violet-500/40"
              >
                <p className="text-sm font-semibold text-white">{work.title}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {work.creator} · {work.statusLabel}
                </p>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/home" className="text-sm text-violet-300 hover:underline">
          ← Exploreホーム
        </Link>
      </div>
    </PlayerShell>
  );
}
