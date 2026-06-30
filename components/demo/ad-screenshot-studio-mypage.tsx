"use client";

import { AdScreenshotStudioOwnedSection } from "@/components/demo/ad-screenshot-studio-owned";
import { StudioMyPageTabs, StudioShell } from "@/components/studio-shell";

/** `/demo/ad-screenshot/studio-mypage` — Studio マイページ作品タブ fixture */
export function AdScreenshotStudioMypagePage() {
  return (
    <StudioShell activeNav="mypage">
      <div className="mx-auto max-w-7xl space-y-6">
        <StudioMyPageTabs activeTab="projects" onTabChange={() => {}} />
        <AdScreenshotStudioOwnedSection />
      </div>
    </StudioShell>
  );
}
