import Link from "next/link";
import { PlayerShell } from "@/components/player-shell";
import {
  DOMAIN_EXPANSION_PROTO_BANNER,
  PROTOTYPE_DETAIL_COMPARE_LINKS,
} from "@/lib/prototype/domain-expansion";

export const metadata = {
  title: "領域拡張プロトタイプ — Forge",
  robots: { index: false, follow: false },
};

export default function PrototypeIndexPage() {
  return (
    <PlayerShell activeNav="home">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-300">
            Preview prototype
          </p>
          <h1 className="text-2xl font-bold text-white">対象領域拡張 — 比較ハブ</h1>
          <p className="rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-xs text-violet-200">
            {DOMAIN_EXPANSION_PROTO_BANNER}
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">A. Explore</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/home" className="text-zinc-400 hover:underline">
                正式ホーム（/home・Production相当）
              </Link>
            </li>
            <li>
              <Link href="/explore/prototype" className="text-violet-300 hover:underline">
                Explore Prototype 横断（/explore/prototype）
              </Link>
            </li>
            <li>
              <Link href="/explore/prototype/game" className="text-violet-300 hover:underline">
                ゲーム（/explore/prototype/game）
              </Link>
            </li>
            <li>
              <Link href="/explore/prototype/audio" className="text-violet-300 hover:underline">
                音楽・音声（/explore/prototype/audio）
              </Link>
            </li>
            <li>
              <Link href="/explore/prototype/dev-tool" className="text-violet-300 hover:underline">
                開発ツール（/explore/prototype/dev-tool）
              </Link>
            </li>
            <li>
              <Link
                href="/explore/prototype/service-app"
                className="text-violet-300 hover:underline"
              >
                Webサービス・アプリ（/explore/prototype/service-app）
              </Link>
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">B. Studio投稿</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/studio/submit?view=category-proto"
                className="text-violet-300 hover:underline"
              >
                投稿フロー比較（新プロトタイプ）
              </Link>
            </li>
            <li>
              <Link href="/studio/submit" className="text-zinc-400 hover:underline">
                既存ゲーム投稿（変更なし）
              </Link>
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">C. 作品詳細上部</h2>
          <ul className="space-y-2 text-sm">
            {PROTOTYPE_DETAIL_COMPARE_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-violet-300 hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PlayerShell>
  );
}
