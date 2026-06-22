import Link from "next/link";

type StudioPreviewSampleBannerProps = {
  compact?: boolean;
};

/** mock Studio 画面用 — 本物の改善ループ Studio と混同しないラベル */
export function StudioPreviewSampleBanner({
  compact = false,
}: StudioPreviewSampleBannerProps) {
  return (
    <div
      className={`rounded-2xl border border-violet-500/25 bg-violet-600/5 ${
        compact ? "px-4 py-3" : "px-5 py-4"
      }`}
      role="note"
    >
      <p className="text-sm font-medium text-violet-200">サンプル作品（プレビュー）</p>
      <p className={`text-xs leading-relaxed text-zinc-500 ${compact ? "mt-1" : "mt-2"}`}>
        架空の作品データです。改善ループ（次に直すこと・版公開など）は
        <Link href="/studio" className="text-violet-300 hover:text-violet-200">
          Studio ホーム
        </Link>
        の「あなたの作品」から開いてください。
      </p>
    </div>
  );
}
