"use client";

import {
  AchievementsTabPanel,
  FeedbackTabPanel,
  FollowingTabPanel,
} from "@/components/mypage-v0-extra-tabs";
import { MyPageTabs, PlayerShell } from "@/components/player-shell";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";

type DemoMypageTab = "feedback" | "achievements" | "following";

const TAB_IDS: DemoMypageTab[] = ["feedback", "achievements", "following"];

function parseTab(param: string | null): DemoMypageTab {
  if (!param || !TAB_IDS.includes(param as DemoMypageTab)) {
    return "feedback";
  }
  return param as DemoMypageTab;
}

function tabHref(tab: DemoMypageTab): string {
  return `/demo/ad-screenshot/mypage?tab=${tab}`;
}

function AdScreenshotPlayerMypageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));

  const setTab = useCallback(
    (tab: DemoMypageTab) => {
      router.replace(tabHref(tab));
    },
    [router],
  );

  return (
    <PlayerShell activeNav="mypage">
      <MyPageTabs
        activeTab={activeTab}
        onTabChange={(tab) => setTab(tab as DemoMypageTab)}
      />
      <div role="tabpanel">
        {activeTab === "feedback" && <FeedbackTabPanel />}
        {activeTab === "achievements" && <AchievementsTabPanel />}
        {activeTab === "following" && <FollowingTabPanel />}
      </div>
    </PlayerShell>
  );
}

export function AdScreenshotPlayerMypagePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-[#0a0a0a] text-zinc-500">
          読み込み中...
        </div>
      }
    >
      <AdScreenshotPlayerMypageContent />
    </Suspense>
  );
}
