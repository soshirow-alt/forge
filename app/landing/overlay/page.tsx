import Link from "next/link";

export const metadata = {
  title: "Landing overlay — 終了",
  robots: { index: false, follow: false },
};

/** overlay 座標合わせは廃止 — 参考用の案内のみ */
export default function LandingOverlayRoute() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#0a0a0a] px-6 text-center text-zinc-300">
      <h1 className="text-lg font-semibold text-white">Overlay 比較は終了しました</h1>
      <p className="max-w-md text-sm text-zinc-500">
        01 LP は v0 正本ベースの印象再現に切り替えています。座標・ピクセル一致の overlay は使いません。
      </p>
      <Link
        href="/landing"
        className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:brightness-110"
      >
        /landing を見る
      </Link>
    </div>
  );
}
