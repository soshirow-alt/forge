"use client";

import Link from "next/link";
import { getProjectNurtureActions } from "@/lib/project-nurture-links";

type ProjectNurtureActionsProps = {
  projectId: string;
  className?: string;
  context?: "studio" | "default";
};

export function ProjectNurtureActions({
  projectId,
  className = "",
  context = "default",
}: ProjectNurtureActionsProps) {
  const actions = getProjectNurtureActions(context);

  return (
    <div className={`rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-4 ${className}`}>
      <p className="text-xs font-medium text-zinc-500">
        {context === "studio" ? "その他のやること" : "やること一覧"}
      </p>
      <ul className="mt-3 space-y-2">
        {actions.map((action) => (
          <li key={action.id}>
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
