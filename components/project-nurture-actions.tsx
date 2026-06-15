"use client";

import Link from "next/link";

type ProjectNurtureActionsProps = {
  projectId: string;
  className?: string;
};

const actions = [
  {
    label: "届いた回答を見る",
    href: (id: string) => `/my-projects?focus=${id}`,
    description: "プレイヤーの回答と集計",
  },
  {
    label: "問いを設定する",
    href: (id: string) => `/projects/${id}/edit#version-prompts`,
    description: "版ごとの質問",
  },
  {
    label: "開発ログを書く",
    href: (id: string) => `/projects/${id}/devlog/new`,
    description: "改善を記録して公開",
  },
  {
    label: "作品情報を編集する",
    href: (id: string) => `/projects/${id}/edit`,
    description: "タイトル・説明・公開設定",
  },
  {
    label: "プレイヤー向けページを確認する",
    href: (id: string) => `/games/${id}`,
    description: "公開中の見え方",
  },
] as const;

export function ProjectNurtureActions({
  projectId,
  className = "",
}: ProjectNurtureActionsProps) {
  return (
    <div className={`rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-4 ${className}`}>
      <p className="text-xs font-medium text-zinc-500">やること一覧</p>
      <ul className="mt-3 space-y-2">
        {actions.map((action) => (
          <li key={action.label}>
            <Link
              href={action.href(projectId)}
              className="group block rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-zinc-800 hover:bg-zinc-900/60"
            >
              <span className="text-sm font-medium text-zinc-200 transition-colors group-hover:text-orange-300">
                {action.label}
              </span>
              <span className="mt-0.5 block text-xs text-zinc-600">
                {action.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
