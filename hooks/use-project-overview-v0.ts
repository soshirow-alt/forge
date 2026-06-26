"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getProjectOverview,
  saveProjectOverview,
  subscribeProjectOverview,
  type ProjectOverviewDraft,
} from "@/lib/project-overview-v0-store";

export function useProjectOverviewV0(projectId: string) {
  const [revision, setRevision] = useState(0);

  useEffect(() => subscribeProjectOverview(() => setRevision((n) => n + 1)), []);

  const draft = getProjectOverview(projectId);

  const save = useCallback(
    (next: ProjectOverviewDraft) => {
      const result = saveProjectOverview(projectId, next);
      if (!result.ok) {
        return result;
      }
      setRevision((n) => n + 1);
      return result;
    },
    [projectId],
  );

  return { draft, save, revision };
}
