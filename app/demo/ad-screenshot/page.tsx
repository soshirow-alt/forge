import Link from "next/link";

const SCENES = [
  {
    href: "/demo/ad-screenshot/studio",
    title: "Studio ホーム — あなたの作品",
    description: "新着 FB バッジ付き mock 3件・ヘッダー通知バッジ",
  },
  {
    href: "/demo/ad-screenshot/studio-mypage",
    title: "Studio マイページ — 作品タブ",
    description: "作品一覧の厚い mock 表示",
  },
  {
    href: "/demo/ad-screenshot/mypage?tab=feedback",
    title: "Player マイページ — FB履歴",
    description: "v0 mock パネル",
  },
  {
    href: "/demo/ad-screenshot/mypage?tab=achievements",
    title: "Player マイページ — 実績",
    description: "v0 mock パネル",
  },
  {
    href: "/demo/ad-screenshot/mypage?tab=following",
    title: "Player マイページ — フォロー中",
    description: "v0 mock パネル",
  },
] as const;

export default function AdScreenshotDemoIndexPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 py-12 text-zinc-100">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-violet-400">
          Demo · Preview / local only
        </p>
        <h1 className="mt-2 text-2xl font-semibold">広告スクショ用 fixture</h1>
        <p className="mt-3 text-sm text-zinc-400">
          本体の <code className="text-zinc-300">/studio</code> や{" "}
          <code className="text-zinc-300">/mypage</code> とは分離されています。本番 hostname では
          404 になります。
        </p>
      </div>

      <ul className="space-y-3">
        {SCENES.map((scene) => (
          <li key={scene.href}>
            <Link
              href={scene.href}
              className="block rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-violet-500/40 hover:bg-zinc-900/70"
            >
              <p className="font-medium text-zinc-100">{scene.title}</p>
              <p className="mt-1 text-sm text-zinc-500">{scene.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
