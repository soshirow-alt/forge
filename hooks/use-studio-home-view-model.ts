"use client";

import { useMemo } from "react";
import { useHideV0MockContent } from "@/lib/forge-deployment-context";
import { buildStudioHomeViewModel } from "@/lib/studio-home-view-model";

export function useStudioHomeViewModel() {
  const hideV0Mock = useHideV0MockContent();
  return useMemo(() => buildStudioHomeViewModel(hideV0Mock), [hideV0Mock]);
}
