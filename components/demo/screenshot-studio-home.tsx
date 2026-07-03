"use client";

import { useMemo, useState } from "react";
import { StudioHomeView } from "@/components/studio-home-page";
import { StudioShell } from "@/components/studio-shell";
import {
  getScreenshotStudioHomeMetrics,
  screenshotStudioHomeHighlights,
} from "@/lib/demo/screenshot-catalog";
import type { StudioHomeGranularity } from "@/lib/studio-home-metrics";

export function ScreenshotStudioHomePage() {
  const [granularity, setGranularity] = useState<StudioHomeGranularity>("month");
  const metrics = useMemo(() => getScreenshotStudioHomeMetrics(granularity), [granularity]);

  return (
    <StudioShell
      activeNav="home"
      notificationBadge={screenshotStudioHomeHighlights.unreadVoiceProjectCount}
    >
      <StudioHomeView
        granularity={granularity}
        onGranularityChange={setGranularity}
        metrics={metrics}
        highlights={screenshotStudioHomeHighlights}
        rpcReady
      />
    </StudioShell>
  );
}
