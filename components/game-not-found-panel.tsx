import Link from "next/link";
import { PlayerShell } from "@/components/player-shell";

export function GameNotFoundPanel() {
  return (
    <PlayerShell>
      <div className="mx-auto max-w-lg rounded-2xl border border-zinc-800/80 bg-zinc-900/40 px-6 py-12 text-center">
        <h1 className="text-xl font-semibold text-white">作品が見つかりません</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500">
          この作品は存在しないか、公開が終了しています。
        </p>
        <Link
          href="/home"
          className="mt-6 inline-flex rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
        >
          発見ホームへ
        </Link>
      </div>
    </PlayerShell>
  );
}
