import Link from "next/link";
import { StudioShell } from "@/components/studio-shell";
import { studioProjects, studioProjectHref } from "@/lib/studio-home-v0-mock-data";

export default function StudioProjectsRoute() {
  return (
    <StudioShell activeNav="projects">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-white">プロジェクト一覧</h1>
          <Link
            href="/submit"
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
          >
            新規投稿
          </Link>
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          検索・フィルタは次フェーズ。現時点は Studio ホームと同じ mock 一覧の stub です。
        </p>
        <ul className="mt-8 space-y-3">
          {studioProjects.map((project) => (
            <li key={project.id}>
              <Link
                href={studioProjectHref(project.id)}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900/60"
              >
                <div>
                  <p className="font-medium text-zinc-200">{project.title}</p>
                  <p className="text-xs text-zinc-500">
                    {project.phase} · {project.version} · 最終更新 {project.updatedLabel}
                  </p>
                </div>
                <span className="text-sm text-violet-400">開く →</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </StudioShell>
  );
}
