"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { projectStudioPath } from "@/lib/project-nurture-links";

export function ProjectEditPage({ projectId }: { projectId: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`${projectStudioPath(projectId)}?edit=project`);
  }, [projectId, router]);

  return null;
}
