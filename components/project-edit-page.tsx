"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { studioOverviewEditHref } from "@/lib/studio-edit-url";

export function ProjectEditPage({ projectId }: { projectId: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(studioOverviewEditHref(projectId, "basic-info"));
  }, [projectId, router]);

  return null;
}
