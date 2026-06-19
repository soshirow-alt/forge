import { StudioShell } from "@/components/studio-shell";

const steps = [
  "投稿",
  "公開",
  "声を見る",
  "改善する",
  "新版公開",
  "正式版公開",
] as const;

export default function StudioGettingStartedRoute() {
  return (
    <StudioShell activeNav="getting-started">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-xl font-semibold text-white">はじめてガイド</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Forge の育成サイクル — ゲームを短いサイクルで育て、声を活かし、正式版へつなげます。
        </p>
        <ol className="mt-8 space-y-4">
          {steps.map((step, index) => (
            <li
              key={step}
              className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-4"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-sm font-bold text-violet-200 ring-1 ring-violet-500/30">
                {index + 1}
              </span>
              <span className="font-medium text-zinc-200">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </StudioShell>
  );
}
