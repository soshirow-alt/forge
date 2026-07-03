import Link from "next/link";
import { SCREENSHOT_SCENES } from "@/lib/demo/screenshot-routes";

export default function ScreenshotDemoHubPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 py-12 text-zinc-100">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-violet-400">
          Demo · Preview / localhost only
        </p>
        <h1 className="mt-2 text-2xl font-semibold">スクリーンショット撮影用</h1>
        <p className="mt-3 text-sm text-zinc-400">
          X投稿・LP・説明資料向けの固定 fixture 画面です。本番 hostname では 404
          になります。データは <code className="text-zinc-300">lib/demo/screenshot-catalog.ts</code>{" "}
          のみを使用し、Supabase には接続しません。
        </p>
      </div>

      <ul className="space-y-3">
        {SCREENSHOT_SCENES.map((scene) => (
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

      <p className="text-xs text-zinc-600">
        旧 fixture:{" "}
        <Link href="/demo/ad-screenshot" className="text-violet-400 hover:text-violet-300">
          /demo/ad-screenshot
        </Link>
      </p>
    </main>
  );
}
