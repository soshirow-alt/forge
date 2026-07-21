"use client";

import { memo, type ReactNode } from "react";
import {
  Compass,
  FileText,
  Heart,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { ForgeTabPanel } from "@/components/forge-tab-panel";
import type { GameDetailTab } from "@/lib/game-detail-tabs";

const TAB_ITEMS: {
  id: GameDetailTab;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "overview", label: "概要", icon: Compass },
  { id: "devlog", label: "開発ログ", icon: FileText },
  { id: "voices", label: "みんなのフィードバック", icon: MessageSquare },
  { id: "special-thanks", label: "Special Thanks", icon: Heart },
];

type GameDetailTabBarProps = {
  activeTab: GameDetailTab;
  onTabChange: (tab: GameDetailTab) => void;
  /** 実データがあるタブのみ。未指定タブは件数を出さない */
  counts?: Partial<Record<GameDetailTab, number>>;
  /** Optional label overrides (e.g. music → 制作ログ). */
  tabLabels?: Partial<Record<GameDetailTab, string>>;
};

export const GameDetailTabBar = memo(function GameDetailTabBar({
  activeTab,
  onTabChange,
  counts,
  tabLabels,
}: GameDetailTabBarProps) {
  return (
    <div className="overflow-x-auto">
      <div
        className="flex min-w-full gap-1 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-1"
        role="tablist"
        aria-label="作品詳細タブ"
      >
        {TAB_ITEMS.map((tab) => {
          const selected = activeTab === tab.id;
          const Icon = tab.icon;
          const count = counts?.[tab.id];
          const label = tabLabels?.[tab.id] ?? tab.label;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onTabChange(tab.id)}
              className={`inline-flex min-w-[9.5rem] flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet-500/70 sm:min-w-0 ${
                selected
                  ? "bg-violet-500/25 text-white ring-1 ring-inset ring-violet-500/50"
                  : "text-zinc-500 hover:bg-violet-500/10 hover:text-zinc-200"
              }`}
            >
              <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{label}</span>
              {typeof count === "number" ? (
                <span
                  className={`rounded-md px-1.5 py-0.5 text-xs tabular-nums ${
                    selected
                      ? "bg-white/15 text-white"
                      : "bg-zinc-800/80 text-zinc-400"
                  }`}
                >
                  {count.toLocaleString()}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
});

type GameDetailTabPanelsProps = {
  activeTab: GameDetailTab;
  visitedTabs: ReadonlySet<GameDetailTab>;
  overview: ReactNode;
  devlog: ReactNode;
  voices: ReactNode;
  specialThanks: ReactNode;
};

export const GameDetailTabPanels = memo(function GameDetailTabPanels({
  activeTab,
  visitedTabs,
  overview,
  devlog,
  voices,
  specialThanks,
}: GameDetailTabPanelsProps) {
  return (
    <div className="min-h-[28rem]">
      <ForgeTabPanel active={activeTab === "overview"}>{overview}</ForgeTabPanel>
      {visitedTabs.has("devlog") ? (
        <ForgeTabPanel active={activeTab === "devlog"}>{devlog}</ForgeTabPanel>
      ) : null}
      {visitedTabs.has("voices") ? (
        <ForgeTabPanel active={activeTab === "voices"}>{voices}</ForgeTabPanel>
      ) : null}
      {visitedTabs.has("special-thanks") ? (
        <ForgeTabPanel active={activeTab === "special-thanks"}>
          {specialThanks}
        </ForgeTabPanel>
      ) : null}
    </div>
  );
});
