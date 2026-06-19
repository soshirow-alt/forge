import { StudioShell } from "@/components/studio-shell";

export default function StudioProjectDetailStubRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <StudioProjectDetailStub params={params} />
  );
}

async function StudioProjectDetailStub({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <StudioShell activeNav="projects">
      <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-16 text-center">
        <h1 className="text-lg font-semibold text-zinc-300">プロジェクト詳細（stub）</h1>
        <p className="mt-2 text-sm text-zinc-500">
          ID: {id} — S-22 タブ画面は次フェーズで実装予定です。
        </p>
      </div>
    </StudioShell>
  );
}
