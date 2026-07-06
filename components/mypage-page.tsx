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
import { ForgeTabPanel } from "@/components/forge-tab-panel";
import { PageLoadingSkeleton } from "@/components/forge-loading-skeletons";
import { useForgePerfRoute } from "@/hooks/use-forge-perf-route";
import { useInstantQueryTab } from "@/hooks/use-instant-query-tab";
import { shouldHideV0MockContent } from "@/lib/production-mode";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

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
  const { activeTab, setActiveTab } = useInstantQueryTab<MyPageTab>({
    parse: parseTab,
    buildHref: (tab) => tabHref(tab),
    perfScope: "mypage-tab",
  });
  const [visitedTabs, setVisitedTabs] = useState<Set<MyPageTab>>(() => {
    const initial = parseTab(tabParam);
    return new Set([initial]);
  });

  useEffect(() => {
    if (tabParam === "developer") {
      router.replace("/studio/mypage");
    }
  }, [router, tabParam]);

  const hideV0Mock = shouldHideV0MockContent();
  const useMockPlayerTabs = !hideV0Mock;

  useForgePerfRoute({
    route: `/mypage?tab=${activeTab}`,
    ready: true,
  });

  const setTab = useCallback(
    (tab: MyPageTab) => {
      setActiveTab(tab);
      setVisitedTabs((prev) => {
        if (prev.has(tab)) {
          return prev;
        }
        const next = new Set(prev);
        next.add(tab);
        return next;
      });
    },
    [setActiveTab],
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
        <ForgeTabPanel active={activeTab === "witnessing"}>
          <MyPageLoopPanel />
        </ForgeTabPanel>
        <ForgeTabPanel active={activeTab === "saved"}>
          <MyPageSavedRealPanel />
        </ForgeTabPanel>
        {visitedTabs.has("play-history") ? (
          <ForgeTabPanel active={activeTab === "play-history"}>
            <PlayHistorySection />
          </ForgeTabPanel>
        ) : null}
        <ForgeTabPanel active={activeTab === "feedback"}>
          {useMockPlayerTabs ? (
            <FeedbackTabPanel />
          ) : (
            <FeatureComingSoonPanel
              title="FB履歴"
              description="あなたが届けたフィードバックの履歴は Coming Soon です。"
            />
          )}
        </ForgeTabPanel>
        <ForgeTabPanel active={activeTab === "achievements"}>
          {useMockPlayerTabs ? (
            <AchievementsTabPanel />
          ) : (
            <FeatureComingSoonPanel
              title="実績"
              description="プレイヤー実績バッジの表示は Coming Soon です。"
            />
          )}
        </ForgeTabPanel>
        {visitedTabs.has("following") ? (
          <ForgeTabPanel active={activeTab === "following"}>
            {hideV0Mock ? <FollowingDevelopersPanel /> : <FollowingTabPanel />}
          </ForgeTabPanel>
        ) : null}
      </div>
    </PlayerShell>
  );
}

export function MyPagePage() {
  return (
    <Suspense
      fallback={
        <PlayerShell activeNav="mypage">
          <PageLoadingSkeleton lines={4} />
        </PlayerShell>
      }
    >
      <MyPagePageContent />
    </Suspense>
  );
}
