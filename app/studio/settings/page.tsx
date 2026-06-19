import { StudioShell } from "@/components/studio-shell";

export default function StudioSettingsStubRoute() {
  return (
    <StudioShell activeNav="settings">
      <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-16 text-center">
        <h1 className="text-lg font-semibold text-zinc-300">Studio 設定（stub）</h1>
        <p className="mt-2 text-sm text-zinc-500">S-24 — プロフィール・通知・アカウントは次フェーズです。</p>
      </div>
    </StudioShell>
  );
}
