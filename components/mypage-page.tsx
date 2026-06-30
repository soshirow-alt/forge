"use client";

import {
  AchievementsTabPanel,
  FeedbackTabPanel,
  FollowingTabPanel,
} from "@/components/mypage-v0-extra-tabs";
import { FollowingDevelopersPanel } from "@/components/following-developers-panel";
import { FeatureComingSoonPanel } from "@/components/feature-coming-soon-panel";
import { MyPageLoopPanel } from "@/components/mypage-loop-panel";
import { MyPageSavedRealPanel } from "@/components/mypage-real-panels";
import { PlayHistorySection } from "@/components/play-history-section";
import { MyPageTabs, PlayerShell } from "@/components/player-shell";
import { shouldHideV0MockContent } from "@/lib/production-mode";
import { isAdScreenshotDemoEnabled } from "@/lib/ad-screenshot-demo";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect } from "react";

export type MyPageTab =
  | "witnessing"
  | "saved"
  | "play-history"
  | "feedback"
  | "achievements"
  | "following";

const TAB_IDS: MyPageTab[] = [
  "witnessing",
  "saved",
  "play-history",
  "feedback",
  "achievements",
  "following",
];

function parseTab(param: string | null): MyPageTab {
  if (!param || param === "witnessing") {
    return "witnessing";
  }
  return TAB_IDS.includes(param as MyPageTab) ? (param as MyPageTab) : "witnessing";
}

function tabHref(tab: MyPageTab): string {
  return tab === "witnessing" ? "/mypage" : `/mypage?tab=${tab}`;
}

function MyPagePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  useEffect(() => {
    if (tabParam === "developer") {
      router.replace("/studio/mypage");
    }
  }, [router, tabParam]);

  const activeTab = parseTab(tabParam);
  const hideV0Mock = shouldHideV0MockContent();
  const adDemoMocks = isAdScreenshotDemoEnabled();
  const useMockPlayerTabs = adDemoMocks || !hideV0Mock;

  const setTab = useCallback(
    (tab: MyPageTab) => {
      router.replace(tabHref(tab));
    },
    [router],
  );

  if (tabParam === "developer") {
    return (
      <PlayerShell activeNav="mypage">
        <p className="text-zinc-500">Studio へ移動しています…</p>
      </PlayerShell>
    );
  }

  return (
    <PlayerShell activeNav="mypage">
      <MyPageTabs activeTab={activeTab} onTabChange={(tab) => setTab(tab as MyPageTab)} />

      <div role="tabpanel">
        {activeTab === "witnessing" && <MyPageLoopPanel />}
        {activeTab === "saved" && <MyPageSavedRealPanel />}
        {activeTab === "play-history" && <PlayHistorySection />}
        {activeTab === "feedback" &&
          (useMockPlayerTabs ? (
            <FeedbackTabPanel />
          ) : (
            <FeatureComingSoonPanel
              title="FB履歴"
              description="あなたが届けたフィードバックの履歴は準備中です。"
            />
          ))}
        {activeTab === "achievements" &&
          (useMockPlayerTabs ? (
            <AchievementsTabPanel />
          ) : (
            <FeatureComingSoonPanel
              title="実績"
              description="プレイヤー実績バッジの表示は準備中です。"
            />
          ))}
        {activeTab === "following" &&
          (hideV0Mock && !adDemoMocks ? (
            <FollowingDevelopersPanel />
          ) : (
            <FollowingTabPanel />
          ))}
      </div>
    </PlayerShell>
  );
}

export function MyPagePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-[#0a0a0a] text-zinc-500">
          読み込み中...
        </div>
      }
    >
      <MyPagePageContent />
    </Suspense>
  );
}
