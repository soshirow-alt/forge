"use client";

import { AdScreenshotStudioOwnedSection } from "@/components/demo/ad-screenshot-studio-owned";
import { StudioShell } from "@/components/studio-shell";
import {
  countStudioUnread,
  studioNotifications,
} from "@/lib/studio-notifications-v0-mock-data";

export function AdScreenshotStudioHomePage() {
  return (
    <StudioShell
      activeNav="home"
      notificationBadge={countStudioUnread(studioNotifications)}
    >
      <div className="mx-auto max-w-7xl space-y-10">
        <AdScreenshotStudioOwnedSection />
      </div>
    </StudioShell>
  );
}
